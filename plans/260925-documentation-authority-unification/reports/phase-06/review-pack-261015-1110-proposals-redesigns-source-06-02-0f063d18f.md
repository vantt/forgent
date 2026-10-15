# Bounded proposals and redesigns review pack

Content commit: 0f063d18fdab01cb6f2c915bb60ff528c5e0f238
Original shard: plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-06-knowledge-registry-redesign.json
Original shard SHA256: e24cf43c232be914afa51eac204db30de7609051b7c5ab1a22c4d1e8eae284cf
Source file: docs/architect/knowledge-registry-redesign.md
Part 2/3; entries: **80**. Source-file group 6/20.
Author session: codex-session:unit-run-1792034226117-40d90d09@2026-10-15
Row-level authoredBy is authoritative for mixed correction authors. Independent ordinary review only; all rows remain pending.

A36 differing-digest rows (0): none.

Absent-target rows (0): none.

Rows changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238 (0): none.

Weak-exact/Judgment population: 26; reviewer chooses and records seed and IDs for at least 10 deep reads (15%, minimum 10, all if fewer), plus every differing/absent pair. Mechanically verify all rows, full digests, anchors, ancestry, source eligibility, one owner and exact-proof thresholds. A36 supersedes the older 100% Weak-exact/Judgment deep-read rule in review-brief; retain its other ordinary-review obligations. If >3% deep rework, deep-read the whole pack. Mark each own note deep or mechanical. No author-selected draw or seed/key is supplied. Complete batch: 1,815 rows, 1,289 Unit-exact / 438 Weak-exact / 88 Judgment; 88 mandatory differing pairs; 114 correction rows.

Return an independent committed report with Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and this five-column table. Consolidate all parts for each original shard before unchanged ordinary application; these slices do not change shard bytes. Use ok/rework/hold with an own note and the full shown-unit digest (literal none for an absent target). Reverse eligibility and triage findings have separate requests and cannot approve these source rows.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

## Native gate blocker at the content pin

D reports eight decision-loss-without-partial-carry findings in the proposals README rationales (the phrase `it omits later siblings` describes the source index). The checker and decision content are unchanged. These are reported blockers, not waived findings. This pack contains 0 affected rows.

```json
[]
```

## claim_10f0084db4d6f55596e75368d83c3c25

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-58, lines 249–261.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-61.
Source digest: 80954ce9b25c6eb754982d0041218c0c1c985cdf50e64f119cd2d04ad2109067
Target digest: 80954ce9b25c6eb754982d0041218c0c1c985cdf50e64f119cd2d04ad2109067
Shown source SHA256: 80954ce9b25c6eb754982d0041218c0c1c985cdf50e64f119cd2d04ad2109067
Shown target SHA256: 80954ce9b25c6eb754982d0041218c0c1c985cdf50e64f119cd2d04ad2109067

### Proposed decision

```json
{
  "claimId": "claim_10f0084db4d6f55596e75368d83c3c25",
  "sourceUnitDigest": "80954ce9b25c6eb754982d0041218c0c1c985cdf50e64f119cd2d04ad2109067",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-61",
  "targetUnitDigest": "80954ce9b25c6eb754982d0041218c0c1c985cdf50e64f119cd2d04ad2109067",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "7. Registry Model",
    "7.3 Document Events"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-58 (lines 249–261) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-61 (lines 273–285); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```yaml
docId: doc-worktree-reclaim-safety-pitfall
topicId: worktree-reclaim-safety
role: pitfall
framework: diataxis
mode: explanation
lifecycle: provisional
currentPath: docs/worktree-reclaim-safety/pitfall.md
aliases:
  - docs/explanation/orphaned-worktree-reclaim-must-check-for-live-uncommitted-work.md
  - docs/explanation/why-reclaimorphanedcheckout-refuses-a-live-session-worktree.md
sourceCaptureIds: [tsk-a, tsk-b]
```
````

### Full target shown text

````text
```yaml
docId: doc-worktree-reclaim-safety-pitfall
topicId: worktree-reclaim-safety
role: pitfall
framework: diataxis
mode: explanation
lifecycle: provisional
currentPath: docs/worktree-reclaim-safety/pitfall.md
aliases:
  - docs/explanation/orphaned-worktree-reclaim-must-check-for-live-uncommitted-work.md
  - docs/explanation/why-reclaimorphanedcheckout-refuses-a-live-session-worktree.md
sourceCaptureIds: [tsk-a, tsk-b]
```
````

## claim_2a4b8c7d99b114a70a00c150d6c722df

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#74-attestation, lines 263–263.
Target: docs/platform/proposals/knowledge-registry-redesign.md#74-attestation.
Source digest: f1d7ce982467ab4b3e6a484b4789cd492af23ddc46f47e96635096fa1a5b7502
Target digest: f1d7ce982467ab4b3e6a484b4789cd492af23ddc46f47e96635096fa1a5b7502
Shown source SHA256: 72e2a347c995846e0a1d8251d274e652ea2d8b62d0faa5e2130711fa2a88d2a7
Shown target SHA256: 72e2a347c995846e0a1d8251d274e652ea2d8b62d0faa5e2130711fa2a88d2a7

### Proposed decision

```json
{
  "claimId": "claim_2a4b8c7d99b114a70a00c150d6c722df",
  "sourceUnitDigest": "f1d7ce982467ab4b3e6a484b4789cd492af23ddc46f47e96635096fa1a5b7502",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "74-attestation",
  "targetUnitDigest": "f1d7ce982467ab4b3e6a484b4789cd492af23ddc46f47e96635096fa1a5b7502",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "7. Registry Model"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#74-attestation (lines 263–263) is carried at docs/platform/proposals/knowledge-registry-redesign.md#74-attestation (lines 287–287); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 7.4 Attestation

Attestation links a capture to a document slot. It is the precise replacement for the old "compound stores docType/docPath" meaning.

An attestation records:

```yaml
captureId: tsk-123
docId: doc-worktree-reclaim-safety-pitfall
docPath: docs/worktree-reclaim-safety/pitfall.md
framework: diataxis
mode: explanation
```

`docPath` in new attestations must equal the document's `currentPath`. Old capture events remain unchanged and are resolved through aliases.
````

### Full target shown text

````text
### 7.4 Attestation

Attestation links a capture to a document slot. It is the precise replacement for the old "compound stores docType/docPath" meaning.

An attestation records:

```yaml
captureId: tsk-123
docId: doc-worktree-reclaim-safety-pitfall
docPath: docs/worktree-reclaim-safety/pitfall.md
framework: diataxis
mode: explanation
```

`docPath` in new attestations must equal the document's `currentPath`. Old capture events remain unchanged and are resolved through aliases.
````

## claim_32ef3262c99390094c2a02c90e2068f9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-59, lines 265–265.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-62.
Source digest: c438f01c2fb0c6da306591d7136e11554781dfe2ca34afa7e735f9e43b3cc98e
Target digest: c438f01c2fb0c6da306591d7136e11554781dfe2ca34afa7e735f9e43b3cc98e
Shown source SHA256: c438f01c2fb0c6da306591d7136e11554781dfe2ca34afa7e735f9e43b3cc98e
Shown target SHA256: c438f01c2fb0c6da306591d7136e11554781dfe2ca34afa7e735f9e43b3cc98e

### Proposed decision

```json
{
  "claimId": "claim_32ef3262c99390094c2a02c90e2068f9",
  "sourceUnitDigest": "c438f01c2fb0c6da306591d7136e11554781dfe2ca34afa7e735f9e43b3cc98e",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-62",
  "targetUnitDigest": "c438f01c2fb0c6da306591d7136e11554781dfe2ca34afa7e735f9e43b3cc98e",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "7. Registry Model",
    "7.4 Attestation"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-59 (lines 265–265) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-62 (lines 289–289); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Attestation links a capture to a document slot. It is the precise replacement for the old "compound stores docType/docPath" meaning.
```

### Full target shown text

```text
Attestation links a capture to a document slot. It is the precise replacement for the old "compound stores docType/docPath" meaning.
```

## claim_a310aed346150414284b2a8d3b472e02

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-60, lines 267–267.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-63.
Source digest: b55701918250f18e1c6dcc23698178cdf520da3128a7b3478f2b05a84db66261
Target digest: b55701918250f18e1c6dcc23698178cdf520da3128a7b3478f2b05a84db66261
Shown source SHA256: b55701918250f18e1c6dcc23698178cdf520da3128a7b3478f2b05a84db66261
Shown target SHA256: b55701918250f18e1c6dcc23698178cdf520da3128a7b3478f2b05a84db66261

### Proposed decision

```json
{
  "claimId": "claim_a310aed346150414284b2a8d3b472e02",
  "sourceUnitDigest": "b55701918250f18e1c6dcc23698178cdf520da3128a7b3478f2b05a84db66261",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-63",
  "targetUnitDigest": "b55701918250f18e1c6dcc23698178cdf520da3128a7b3478f2b05a84db66261",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "7. Registry Model",
    "7.4 Attestation"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-60 (lines 267–267) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-63 (lines 291–291); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
An attestation records:
```

### Full target shown text

```text
An attestation records:
```

## claim_296bbaeefee2f5a53b6383a04907e1ff

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-61, lines 269–275.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-64.
Source digest: b55d20b13ec03d7ddcbf10ca247a66916610a8c429fee5873a0225aac01b2aa2
Target digest: b55d20b13ec03d7ddcbf10ca247a66916610a8c429fee5873a0225aac01b2aa2
Shown source SHA256: b55d20b13ec03d7ddcbf10ca247a66916610a8c429fee5873a0225aac01b2aa2
Shown target SHA256: b55d20b13ec03d7ddcbf10ca247a66916610a8c429fee5873a0225aac01b2aa2

### Proposed decision

```json
{
  "claimId": "claim_296bbaeefee2f5a53b6383a04907e1ff",
  "sourceUnitDigest": "b55d20b13ec03d7ddcbf10ca247a66916610a8c429fee5873a0225aac01b2aa2",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-64",
  "targetUnitDigest": "b55d20b13ec03d7ddcbf10ca247a66916610a8c429fee5873a0225aac01b2aa2",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "7. Registry Model",
    "7.4 Attestation"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-61 (lines 269–275) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-64 (lines 293–299); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```yaml
captureId: tsk-123
docId: doc-worktree-reclaim-safety-pitfall
docPath: docs/worktree-reclaim-safety/pitfall.md
framework: diataxis
mode: explanation
```
````

### Full target shown text

````text
```yaml
captureId: tsk-123
docId: doc-worktree-reclaim-safety-pitfall
docPath: docs/worktree-reclaim-safety/pitfall.md
framework: diataxis
mode: explanation
```
````

## claim_24e2d2b18408f09751f490c9b0d775c8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-62, lines 277–277.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-65.
Source digest: 6d045254010697e0e481a67dd6538ab7cb61cf5e4f465ac634e46c4f3e4bbbb0
Target digest: 6d045254010697e0e481a67dd6538ab7cb61cf5e4f465ac634e46c4f3e4bbbb0
Shown source SHA256: 6d045254010697e0e481a67dd6538ab7cb61cf5e4f465ac634e46c4f3e4bbbb0
Shown target SHA256: 6d045254010697e0e481a67dd6538ab7cb61cf5e4f465ac634e46c4f3e4bbbb0

### Proposed decision

```json
{
  "claimId": "claim_24e2d2b18408f09751f490c9b0d775c8",
  "sourceUnitDigest": "6d045254010697e0e481a67dd6538ab7cb61cf5e4f465ac634e46c4f3e4bbbb0",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-65",
  "targetUnitDigest": "6d045254010697e0e481a67dd6538ab7cb61cf5e4f465ac634e46c4f3e4bbbb0",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "7. Registry Model",
    "7.4 Attestation"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-62 (lines 277–277) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-65 (lines 301–301); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`docPath` in new attestations must equal the document's `currentPath`. Old capture events remain unchanged and are resolved through aliases.
```

### Full target shown text

```text
`docPath` in new attestations must equal the document's `currentPath`. Old capture events remain unchanged and are resolved through aliases.
```

## claim_e9ac429a0ebed14c07f6d22b5049ba69

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#8-producer-enforcement, lines 279–279.
Target: docs/platform/proposals/knowledge-registry-redesign.md#8-producer-enforcement.
Source digest: 1c2c81a26d9961efc107a16509440de586331a664ad42fc44deb43bf77d7ae78
Target digest: 1c2c81a26d9961efc107a16509440de586331a664ad42fc44deb43bf77d7ae78
Shown source SHA256: 461a6957162be802e284e2378e3c06828f918eff8948fcf7afe4f46d549a75a9
Shown target SHA256: 461a6957162be802e284e2378e3c06828f918eff8948fcf7afe4f46d549a75a9

### Proposed decision

```json
{
  "claimId": "claim_e9ac429a0ebed14c07f6d22b5049ba69",
  "sourceUnitDigest": "1c2c81a26d9961efc107a16509440de586331a664ad42fc44deb43bf77d7ae78",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "8-producer-enforcement",
  "targetUnitDigest": "1c2c81a26d9961efc107a16509440de586331a664ad42fc44deb43bf77d7ae78",
  "targetAncestry": [
    "Knowledge Registry Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#8-producer-enforcement (lines 279–279) is carried at docs/platform/proposals/knowledge-registry-redesign.md#8-producer-enforcement (lines 303–303); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
## 8. Producer Enforcement

The producer door must enforce registry membership in code. Skill prose is not enough.

The current producer already refuses a path that is not committed at the main checkout's `HEAD`. The new producer gate extends that rule:

```txt
knowledge attestation / legacy compound:
  require path committed at main HEAD
  require registry enforcement active
  require path equals a registered document currentPath
  reject alias paths for new attestations
  require topic and role still valid
  reject if the target would violate activeDoc(topicId, role) <= 1
```

This closes the rollout window where the corpus has been migrated but an old writer still self-names a fresh path. Even if a legacy writer commits `docs/explanation/new-random.md`, attestation fails because the path is not a registry current path.
````

### Full target shown text

````text
## 8. Producer Enforcement

The producer door must enforce registry membership in code. Skill prose is not enough.

The current producer already refuses a path that is not committed at the main checkout's `HEAD`. The new producer gate extends that rule:

```txt
knowledge attestation / legacy compound:
  require path committed at main HEAD
  require registry enforcement active
  require path equals a registered document currentPath
  reject alias paths for new attestations
  require topic and role still valid
  reject if the target would violate activeDoc(topicId, role) <= 1
```

This closes the rollout window where the corpus has been migrated but an old writer still self-names a fresh path. Even if a legacy writer commits `docs/explanation/new-random.md`, attestation fails because the path is not a registry current path.
````

## claim_090f207ee6b8b8a52ef32fc87e94d92f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-63, lines 281–281.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-66.
Source digest: f31638737c60a3bbbf4aeb001089093b4718887963206c1c9ee23dd06c8b1554
Target digest: f31638737c60a3bbbf4aeb001089093b4718887963206c1c9ee23dd06c8b1554
Shown source SHA256: f31638737c60a3bbbf4aeb001089093b4718887963206c1c9ee23dd06c8b1554
Shown target SHA256: f31638737c60a3bbbf4aeb001089093b4718887963206c1c9ee23dd06c8b1554

### Proposed decision

```json
{
  "claimId": "claim_090f207ee6b8b8a52ef32fc87e94d92f",
  "sourceUnitDigest": "f31638737c60a3bbbf4aeb001089093b4718887963206c1c9ee23dd06c8b1554",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-66",
  "targetUnitDigest": "f31638737c60a3bbbf4aeb001089093b4718887963206c1c9ee23dd06c8b1554",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "8. Producer Enforcement"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-63 (lines 281–281) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-66 (lines 305–305); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The producer door must enforce registry membership in code. Skill prose is not enough.
```

### Full target shown text

```text
The producer door must enforce registry membership in code. Skill prose is not enough.
```

## claim_aabe0d834bc51b1a3fb9e06b817d5fd3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-64, lines 283–283.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-67.
Source digest: 0674097e44c4206ecb3eca922cefe57970b3716621510c5b94e91dbe7064bbaf
Target digest: 0674097e44c4206ecb3eca922cefe57970b3716621510c5b94e91dbe7064bbaf
Shown source SHA256: 0674097e44c4206ecb3eca922cefe57970b3716621510c5b94e91dbe7064bbaf
Shown target SHA256: 0674097e44c4206ecb3eca922cefe57970b3716621510c5b94e91dbe7064bbaf

### Proposed decision

```json
{
  "claimId": "claim_aabe0d834bc51b1a3fb9e06b817d5fd3",
  "sourceUnitDigest": "0674097e44c4206ecb3eca922cefe57970b3716621510c5b94e91dbe7064bbaf",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-67",
  "targetUnitDigest": "0674097e44c4206ecb3eca922cefe57970b3716621510c5b94e91dbe7064bbaf",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "8. Producer Enforcement"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-64 (lines 283–283) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-67 (lines 307–307); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The current producer already refuses a path that is not committed at the main checkout's `HEAD`. The new producer gate extends that rule:
```

### Full target shown text

```text
The current producer already refuses a path that is not committed at the main checkout's `HEAD`. The new producer gate extends that rule:
```

## claim_c06a0fb00d16db58b6d9b8e7d4947bfe

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-65, lines 285–293.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-68.
Source digest: 4bb739e6e32c58b24146606553425779c821fdb566aabfd97ff35fb6910dbe63
Target digest: 4bb739e6e32c58b24146606553425779c821fdb566aabfd97ff35fb6910dbe63
Shown source SHA256: 4bb739e6e32c58b24146606553425779c821fdb566aabfd97ff35fb6910dbe63
Shown target SHA256: 4bb739e6e32c58b24146606553425779c821fdb566aabfd97ff35fb6910dbe63

### Proposed decision

```json
{
  "claimId": "claim_c06a0fb00d16db58b6d9b8e7d4947bfe",
  "sourceUnitDigest": "4bb739e6e32c58b24146606553425779c821fdb566aabfd97ff35fb6910dbe63",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-68",
  "targetUnitDigest": "4bb739e6e32c58b24146606553425779c821fdb566aabfd97ff35fb6910dbe63",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "8. Producer Enforcement"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-65 (lines 285–293) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-68 (lines 309–317); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
knowledge attestation / legacy compound:
  require path committed at main HEAD
  require registry enforcement active
  require path equals a registered document currentPath
  reject alias paths for new attestations
  require topic and role still valid
  reject if the target would violate activeDoc(topicId, role) <= 1
```
````

### Full target shown text

````text
```txt
knowledge attestation / legacy compound:
  require path committed at main HEAD
  require registry enforcement active
  require path equals a registered document currentPath
  reject alias paths for new attestations
  require topic and role still valid
  reject if the target would violate activeDoc(topicId, role) <= 1
```
````

## claim_deae405db63e75286a1ca91027292ee5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-66, lines 295–295.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-69.
Source digest: c7ff2c6a52cbb5cf67f0752b801d20afac23947b8c753245bb6b1f001e06b1a5
Target digest: c7ff2c6a52cbb5cf67f0752b801d20afac23947b8c753245bb6b1f001e06b1a5
Shown source SHA256: c7ff2c6a52cbb5cf67f0752b801d20afac23947b8c753245bb6b1f001e06b1a5
Shown target SHA256: c7ff2c6a52cbb5cf67f0752b801d20afac23947b8c753245bb6b1f001e06b1a5

### Proposed decision

```json
{
  "claimId": "claim_deae405db63e75286a1ca91027292ee5",
  "sourceUnitDigest": "c7ff2c6a52cbb5cf67f0752b801d20afac23947b8c753245bb6b1f001e06b1a5",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-69",
  "targetUnitDigest": "c7ff2c6a52cbb5cf67f0752b801d20afac23947b8c753245bb6b1f001e06b1a5",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "8. Producer Enforcement"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-66 (lines 295–295) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-69 (lines 319–319); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
This closes the rollout window where the corpus has been migrated but an old writer still self-names a fresh path. Even if a legacy writer commits `docs/explanation/new-random.md`, attestation fails because the path is not a registry current path.
```

### Full target shown text

```text
This closes the rollout window where the corpus has been migrated but an old writer still self-names a fresh path. Even if a legacy writer commits `docs/explanation/new-random.md`, attestation fails because the path is not a registry current path.
```

## claim_88a0ca206c122c439bb05126bf861e52

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#81-reserved-slots, lines 297–297.
Target: docs/platform/proposals/knowledge-registry-redesign.md#81-reserved-slots.
Source digest: 5ba37f33b16304033cfebb42e32b70a70632e11648190f30e8119b1e3089a16a
Target digest: 5ba37f33b16304033cfebb42e32b70a70632e11648190f30e8119b1e3089a16a
Shown source SHA256: 8b0e28d791deba171ececac21dd5bf147832ca6a40b150e9c8ee80773958915e
Shown target SHA256: 8b0e28d791deba171ececac21dd5bf147832ca6a40b150e9c8ee80773958915e

### Proposed decision

```json
{
  "claimId": "claim_88a0ca206c122c439bb05126bf861e52",
  "sourceUnitDigest": "5ba37f33b16304033cfebb42e32b70a70632e11648190f30e8119b1e3089a16a",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "81-reserved-slots",
  "targetUnitDigest": "5ba37f33b16304033cfebb42e32b70a70632e11648190f30e8119b1e3089a16a",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "8. Producer Enforcement"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#81-reserved-slots (lines 297–297) is carried at docs/platform/proposals/knowledge-registry-redesign.md#81-reserved-slots (lines 321–321); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 8.1 Reserved Slots

New documents are created by reserving a slot first:

```txt
fgos doc reserve --topic <topicId> --role <role> --path docs/<purpose>/<role>.md
```

The writer then renders prose and commits the file. Only after the file exists at `HEAD` may the capture be attested to that document.

`reserved` is not a prose lifecycle claim. It is a registry-level path hold.
````

### Full target shown text

````text
### 8.1 Reserved Slots

New documents are created by reserving a slot first:

```txt
fgos doc reserve --topic <topicId> --role <role> --path docs/<purpose>/<role>.md
```

The writer then renders prose and commits the file. Only after the file exists at `HEAD` may the capture be attested to that document.

`reserved` is not a prose lifecycle claim. It is a registry-level path hold.
````

## claim_e2dcb462bec13d30b92ad0a913bd8bce

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-67, lines 299–299.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-70.
Source digest: 04c8ba200f9e5090de4f21bdcf0aad8ad9c2f38243bb047c606dbb9f82dd527b
Target digest: 04c8ba200f9e5090de4f21bdcf0aad8ad9c2f38243bb047c606dbb9f82dd527b
Shown source SHA256: 04c8ba200f9e5090de4f21bdcf0aad8ad9c2f38243bb047c606dbb9f82dd527b
Shown target SHA256: 04c8ba200f9e5090de4f21bdcf0aad8ad9c2f38243bb047c606dbb9f82dd527b

### Proposed decision

```json
{
  "claimId": "claim_e2dcb462bec13d30b92ad0a913bd8bce",
  "sourceUnitDigest": "04c8ba200f9e5090de4f21bdcf0aad8ad9c2f38243bb047c606dbb9f82dd527b",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-70",
  "targetUnitDigest": "04c8ba200f9e5090de4f21bdcf0aad8ad9c2f38243bb047c606dbb9f82dd527b",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "8. Producer Enforcement",
    "8.1 Reserved Slots"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-67 (lines 299–299) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-70 (lines 323–323); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
New documents are created by reserving a slot first:
```

### Full target shown text

```text
New documents are created by reserving a slot first:
```

## claim_70a82c061f34a86088a86b90c632ea70

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-68, lines 301–303.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-71.
Source digest: 0c4b5ddcde02b724f5bbc32982fa03b14eafdc78a6bc3a247a82379ea6ef7b61
Target digest: 0c4b5ddcde02b724f5bbc32982fa03b14eafdc78a6bc3a247a82379ea6ef7b61
Shown source SHA256: 0c4b5ddcde02b724f5bbc32982fa03b14eafdc78a6bc3a247a82379ea6ef7b61
Shown target SHA256: 0c4b5ddcde02b724f5bbc32982fa03b14eafdc78a6bc3a247a82379ea6ef7b61

### Proposed decision

```json
{
  "claimId": "claim_70a82c061f34a86088a86b90c632ea70",
  "sourceUnitDigest": "0c4b5ddcde02b724f5bbc32982fa03b14eafdc78a6bc3a247a82379ea6ef7b61",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-71",
  "targetUnitDigest": "0c4b5ddcde02b724f5bbc32982fa03b14eafdc78a6bc3a247a82379ea6ef7b61",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "8. Producer Enforcement",
    "8.1 Reserved Slots"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-68 (lines 301–303) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-71 (lines 325–327); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
fgos doc reserve --topic <topicId> --role <role> --path docs/<purpose>/<role>.md
```
````

### Full target shown text

````text
```txt
fgos doc reserve --topic <topicId> --role <role> --path docs/<purpose>/<role>.md
```
````

## claim_eaeb448f8e52cd7b881b5e941cbe042f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-69, lines 305–305.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-72.
Source digest: 5f85fc9702eae2d68c051c7e6c59dedcfc48ef5feeccc9137b6e3ee7b42ef5c9
Target digest: 5f85fc9702eae2d68c051c7e6c59dedcfc48ef5feeccc9137b6e3ee7b42ef5c9
Shown source SHA256: 5f85fc9702eae2d68c051c7e6c59dedcfc48ef5feeccc9137b6e3ee7b42ef5c9
Shown target SHA256: 5f85fc9702eae2d68c051c7e6c59dedcfc48ef5feeccc9137b6e3ee7b42ef5c9

### Proposed decision

```json
{
  "claimId": "claim_eaeb448f8e52cd7b881b5e941cbe042f",
  "sourceUnitDigest": "5f85fc9702eae2d68c051c7e6c59dedcfc48ef5feeccc9137b6e3ee7b42ef5c9",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-72",
  "targetUnitDigest": "5f85fc9702eae2d68c051c7e6c59dedcfc48ef5feeccc9137b6e3ee7b42ef5c9",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "8. Producer Enforcement",
    "8.1 Reserved Slots"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-69 (lines 305–305) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-72 (lines 329–329); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The writer then renders prose and commits the file. Only after the file exists at `HEAD` may the capture be attested to that document.
```

### Full target shown text

```text
The writer then renders prose and commits the file. Only after the file exists at `HEAD` may the capture be attested to that document.
```

## claim_64f01a59fd4ef00a1d0952bdcae43eeb

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-70, lines 307–307.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-73.
Source digest: da2912b239898abbf136030386f6fdd052db5437552ab4bcc5c888633d5c4241
Target digest: da2912b239898abbf136030386f6fdd052db5437552ab4bcc5c888633d5c4241
Shown source SHA256: da2912b239898abbf136030386f6fdd052db5437552ab4bcc5c888633d5c4241
Shown target SHA256: da2912b239898abbf136030386f6fdd052db5437552ab4bcc5c888633d5c4241

### Proposed decision

```json
{
  "claimId": "claim_64f01a59fd4ef00a1d0952bdcae43eeb",
  "sourceUnitDigest": "da2912b239898abbf136030386f6fdd052db5437552ab4bcc5c888633d5c4241",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-73",
  "targetUnitDigest": "da2912b239898abbf136030386f6fdd052db5437552ab4bcc5c888633d5c4241",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "8. Producer Enforcement",
    "8.1 Reserved Slots"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-70 (lines 307–307) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-73 (lines 331–331); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`reserved` is not a prose lifecycle claim. It is a registry-level path hold.
```

### Full target shown text

```text
`reserved` is not a prose lifecycle claim. It is a registry-level path hold.
```

## claim_14949e78d0cace932bcf3f419ed53fb1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#82-provisional-by-default, lines 309–309.
Target: docs/platform/proposals/knowledge-registry-redesign.md#82-provisional-by-default.
Source digest: 5088f76ac322ea63f710838409bf51a32213edcf6f0e966e43a856e86b5a6081
Target digest: 5088f76ac322ea63f710838409bf51a32213edcf6f0e966e43a856e86b5a6081
Shown source SHA256: 9e0fdc3d0cd61564449db531819c54d881ce6e5dec6f667750437da3197ed05d
Shown target SHA256: 9e0fdc3d0cd61564449db531819c54d881ce6e5dec6f667750437da3197ed05d

### Proposed decision

```json
{
  "claimId": "claim_14949e78d0cace932bcf3f419ed53fb1",
  "sourceUnitDigest": "5088f76ac322ea63f710838409bf51a32213edcf6f0e966e43a856e86b5a6081",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "82-provisional-by-default",
  "targetUnitDigest": "5088f76ac322ea63f710838409bf51a32213edcf6f0e966e43a856e86b5a6081",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "8. Producer Enforcement"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#82-provisional-by-default (lines 309–309) is carried at docs/platform/proposals/knowledge-registry-redesign.md#82-provisional-by-default (lines 333–333); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 8.2 Provisional By Default

The conservative policy is: rendered prose becomes `provisional`, not `active`.

A human-registered topic proves the slot is legitimate. It does not prove that the generated prose is authoritative. Promotion remains an explicit `fgos doc promote` action unless a later decision narrows the policy.

Open policy question: if a topic and document slot were both explicitly created by a human for a known purpose, should the first rendered document move directly to `active`? The current design says no by default.
```

### Full target shown text

```text
### 8.2 Provisional By Default

The conservative policy is: rendered prose becomes `provisional`, not `active`.

A human-registered topic proves the slot is legitimate. It does not prove that the generated prose is authoritative. Promotion remains an explicit `fgos doc promote` action unless a later decision narrows the policy.

Open policy question: if a topic and document slot were both explicitly created by a human for a known purpose, should the first rendered document move directly to `active`? The current design says no by default.
```

## claim_99d3ee592ef6dc3d8ac0ac2aae555c28

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-71, lines 311–311.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-74.
Source digest: 8575adc4f01fe5f14ae5440a47806f126bcf15b22e538df31e3d179c9f368c9e
Target digest: 8575adc4f01fe5f14ae5440a47806f126bcf15b22e538df31e3d179c9f368c9e
Shown source SHA256: 8575adc4f01fe5f14ae5440a47806f126bcf15b22e538df31e3d179c9f368c9e
Shown target SHA256: 8575adc4f01fe5f14ae5440a47806f126bcf15b22e538df31e3d179c9f368c9e

### Proposed decision

```json
{
  "claimId": "claim_99d3ee592ef6dc3d8ac0ac2aae555c28",
  "sourceUnitDigest": "8575adc4f01fe5f14ae5440a47806f126bcf15b22e538df31e3d179c9f368c9e",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-74",
  "targetUnitDigest": "8575adc4f01fe5f14ae5440a47806f126bcf15b22e538df31e3d179c9f368c9e",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "8. Producer Enforcement",
    "8.2 Provisional By Default"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-71 (lines 311–311) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-74 (lines 335–335); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The conservative policy is: rendered prose becomes `provisional`, not `active`.
```

### Full target shown text

```text
The conservative policy is: rendered prose becomes `provisional`, not `active`.
```

## claim_eeb631a5cd1a73e69dac2eacc1c2a873

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-72, lines 313–313.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-75.
Source digest: faad692cb74eddb36df0a0b0c7fae8be1e1860a0813afaf985f146b00b943dbd
Target digest: faad692cb74eddb36df0a0b0c7fae8be1e1860a0813afaf985f146b00b943dbd
Shown source SHA256: faad692cb74eddb36df0a0b0c7fae8be1e1860a0813afaf985f146b00b943dbd
Shown target SHA256: faad692cb74eddb36df0a0b0c7fae8be1e1860a0813afaf985f146b00b943dbd

### Proposed decision

```json
{
  "claimId": "claim_eeb631a5cd1a73e69dac2eacc1c2a873",
  "sourceUnitDigest": "faad692cb74eddb36df0a0b0c7fae8be1e1860a0813afaf985f146b00b943dbd",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-75",
  "targetUnitDigest": "faad692cb74eddb36df0a0b0c7fae8be1e1860a0813afaf985f146b00b943dbd",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "8. Producer Enforcement",
    "8.2 Provisional By Default"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-72 (lines 313–313) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-75 (lines 337–337); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
A human-registered topic proves the slot is legitimate. It does not prove that the generated prose is authoritative. Promotion remains an explicit `fgos doc promote` action unless a later decision narrows the policy.
```

### Full target shown text

```text
A human-registered topic proves the slot is legitimate. It does not prove that the generated prose is authoritative. Promotion remains an explicit `fgos doc promote` action unless a later decision narrows the policy.
```

## claim_79a2ebf495ba2b6b937f84d2eda61521

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-73, lines 315–315.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-76.
Source digest: ecf4c5edb1fbf70ebb931033de4526a643b76c0298d2c00478e245d582d8466b
Target digest: ecf4c5edb1fbf70ebb931033de4526a643b76c0298d2c00478e245d582d8466b
Shown source SHA256: ecf4c5edb1fbf70ebb931033de4526a643b76c0298d2c00478e245d582d8466b
Shown target SHA256: ecf4c5edb1fbf70ebb931033de4526a643b76c0298d2c00478e245d582d8466b

### Proposed decision

```json
{
  "claimId": "claim_79a2ebf495ba2b6b937f84d2eda61521",
  "sourceUnitDigest": "ecf4c5edb1fbf70ebb931033de4526a643b76c0298d2c00478e245d582d8466b",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-76",
  "targetUnitDigest": "ecf4c5edb1fbf70ebb931033de4526a643b76c0298d2c00478e245d582d8466b",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "8. Producer Enforcement",
    "8.2 Provisional By Default"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-73 (lines 315–315) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-76 (lines 339–339); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Open policy question: if a topic and document slot were both explicitly created by a human for a known purpose, should the first rendered document move directly to `active`? The current design says no by default.
```

### Full target shown text

```text
Open policy question: if a topic and document slot were both explicitly created by a human for a known purpose, should the first rendered document move directly to `active`? The current design says no by default.
```

## claim_d88d928ef73db469f9bc24bb9f22fe8b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#9-resolver, lines 317–317.
Target: docs/platform/proposals/knowledge-registry-redesign.md#9-resolver.
Source digest: 0c46405625be787bbc56ceb44696c7f0750b0b24b16702d4a876d20ee4859c14
Target digest: 0c46405625be787bbc56ceb44696c7f0750b0b24b16702d4a876d20ee4859c14
Shown source SHA256: 6eaba314b4d660ab3ede8f98d22d5b08b6e8aa54b2cbd3f51e11d21e74f07e29
Shown target SHA256: 6eaba314b4d660ab3ede8f98d22d5b08b6e8aa54b2cbd3f51e11d21e74f07e29

### Proposed decision

```json
{
  "claimId": "claim_d88d928ef73db469f9bc24bb9f22fe8b",
  "sourceUnitDigest": "0c46405625be787bbc56ceb44696c7f0750b0b24b16702d4a876d20ee4859c14",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "9-resolver",
  "targetUnitDigest": "0c46405625be787bbc56ceb44696c7f0750b0b24b16702d4a876d20ee4859c14",
  "targetAncestry": [
    "Knowledge Registry Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#9-resolver (lines 317–317) is carried at docs/platform/proposals/knowledge-registry-redesign.md#9-resolver (lines 341–341); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
## 9. Resolver

Every read surface that accepts a document path must resolve through the registry:

```txt
resolveDocPath(path):
  if path equals currentPath: return doc
  if path equals alias: return doc with aliasHit
  otherwise: return null
```

Read surfaces use both current and historical paths:

- `doc-sources oldPath` returns captures that named the old path and the current document they now feed.
- `doc-sources currentPath` returns captures that named the current path plus captures that named aliases.
- `docs-index` displays current paths, lifecycle, topic, role, framework, mode, entities, and source reachability.

The resolver must distinguish read forgiveness from write strictness. Alias resolution is allowed for reads. It is refused for new writes.
````

### Full target shown text

````text
## 9. Resolver

Every read surface that accepts a document path must resolve through the registry:

```txt
resolveDocPath(path):
  if path equals currentPath: return doc
  if path equals alias: return doc with aliasHit
  otherwise: return null
```

Read surfaces use both current and historical paths:

- `doc-sources oldPath` returns captures that named the old path and the current document they now feed.
- `doc-sources currentPath` returns captures that named the current path plus captures that named aliases.
- `docs-index` displays current paths, lifecycle, topic, role, framework, mode, entities, and source reachability.

The resolver must distinguish read forgiveness from write strictness. Alias resolution is allowed for reads. It is refused for new writes.
````

## claim_ba884f2fb21f706b020199ae5eb51203

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-74, lines 319–319.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-77.
Source digest: 29596c6aa111f2ad7e503eeb3f6e2618af993866d569dd73eb508bdc2aaf82ec
Target digest: 29596c6aa111f2ad7e503eeb3f6e2618af993866d569dd73eb508bdc2aaf82ec
Shown source SHA256: 29596c6aa111f2ad7e503eeb3f6e2618af993866d569dd73eb508bdc2aaf82ec
Shown target SHA256: 29596c6aa111f2ad7e503eeb3f6e2618af993866d569dd73eb508bdc2aaf82ec

### Proposed decision

```json
{
  "claimId": "claim_ba884f2fb21f706b020199ae5eb51203",
  "sourceUnitDigest": "29596c6aa111f2ad7e503eeb3f6e2618af993866d569dd73eb508bdc2aaf82ec",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-77",
  "targetUnitDigest": "29596c6aa111f2ad7e503eeb3f6e2618af993866d569dd73eb508bdc2aaf82ec",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "9. Resolver"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-74 (lines 319–319) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-77 (lines 343–343); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Every read surface that accepts a document path must resolve through the registry:
```

### Full target shown text

```text
Every read surface that accepts a document path must resolve through the registry:
```

## claim_293cf7be184223bb9bada997f5b7a86b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-75, lines 321–326.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-78.
Source digest: 52b80de4332114fa40b9a88b9d786cbb4e9d604ba0b90921fe95ee8b4f908bb2
Target digest: 52b80de4332114fa40b9a88b9d786cbb4e9d604ba0b90921fe95ee8b4f908bb2
Shown source SHA256: 52b80de4332114fa40b9a88b9d786cbb4e9d604ba0b90921fe95ee8b4f908bb2
Shown target SHA256: 52b80de4332114fa40b9a88b9d786cbb4e9d604ba0b90921fe95ee8b4f908bb2

### Proposed decision

```json
{
  "claimId": "claim_293cf7be184223bb9bada997f5b7a86b",
  "sourceUnitDigest": "52b80de4332114fa40b9a88b9d786cbb4e9d604ba0b90921fe95ee8b4f908bb2",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-78",
  "targetUnitDigest": "52b80de4332114fa40b9a88b9d786cbb4e9d604ba0b90921fe95ee8b4f908bb2",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "9. Resolver"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-75 (lines 321–326) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-78 (lines 345–350); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
resolveDocPath(path):
  if path equals currentPath: return doc
  if path equals alias: return doc with aliasHit
  otherwise: return null
```
````

### Full target shown text

````text
```txt
resolveDocPath(path):
  if path equals currentPath: return doc
  if path equals alias: return doc with aliasHit
  otherwise: return null
```
````

## claim_89294129842292eed02e81c6329ac647

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-76, lines 328–328.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-79.
Source digest: c0092a05c75c3949acd5d18a59c61f014be53dc05ce2ba03849cf9b0ed7986ac
Target digest: c0092a05c75c3949acd5d18a59c61f014be53dc05ce2ba03849cf9b0ed7986ac
Shown source SHA256: c0092a05c75c3949acd5d18a59c61f014be53dc05ce2ba03849cf9b0ed7986ac
Shown target SHA256: c0092a05c75c3949acd5d18a59c61f014be53dc05ce2ba03849cf9b0ed7986ac

### Proposed decision

```json
{
  "claimId": "claim_89294129842292eed02e81c6329ac647",
  "sourceUnitDigest": "c0092a05c75c3949acd5d18a59c61f014be53dc05ce2ba03849cf9b0ed7986ac",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-79",
  "targetUnitDigest": "c0092a05c75c3949acd5d18a59c61f014be53dc05ce2ba03849cf9b0ed7986ac",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "9. Resolver"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-76 (lines 328–328) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-79 (lines 352–352); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Read surfaces use both current and historical paths:
```

### Full target shown text

```text
Read surfaces use both current and historical paths:
```

## claim_9330f12e71057d069f14bac865d6ceec

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-77, lines 330–332.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-80.
Source digest: 580bfe98f4444aa719ebb03e733c8266f5e05707ecacf901324d580ad3885fa8
Target digest: 580bfe98f4444aa719ebb03e733c8266f5e05707ecacf901324d580ad3885fa8
Shown source SHA256: 580bfe98f4444aa719ebb03e733c8266f5e05707ecacf901324d580ad3885fa8
Shown target SHA256: 580bfe98f4444aa719ebb03e733c8266f5e05707ecacf901324d580ad3885fa8

### Proposed decision

```json
{
  "claimId": "claim_9330f12e71057d069f14bac865d6ceec",
  "sourceUnitDigest": "580bfe98f4444aa719ebb03e733c8266f5e05707ecacf901324d580ad3885fa8",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-80",
  "targetUnitDigest": "580bfe98f4444aa719ebb03e733c8266f5e05707ecacf901324d580ad3885fa8",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "9. Resolver"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-77 (lines 330–332) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-80 (lines 354–356); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- `doc-sources oldPath` returns captures that named the old path and the current document they now feed.
- `doc-sources currentPath` returns captures that named the current path plus captures that named aliases.
- `docs-index` displays current paths, lifecycle, topic, role, framework, mode, entities, and source reachability.
```

### Full target shown text

```text
- `doc-sources oldPath` returns captures that named the old path and the current document they now feed.
- `doc-sources currentPath` returns captures that named the current path plus captures that named aliases.
- `docs-index` displays current paths, lifecycle, topic, role, framework, mode, entities, and source reachability.
```

## claim_9cc9ee0dd6aa0130e4bf5042b51fb600

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-78, lines 334–334.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-81.
Source digest: a92dc3d677954deff41e8e1ebafc53a16e6e626a13b86214a4b73c95250890a4
Target digest: a92dc3d677954deff41e8e1ebafc53a16e6e626a13b86214a4b73c95250890a4
Shown source SHA256: a92dc3d677954deff41e8e1ebafc53a16e6e626a13b86214a4b73c95250890a4
Shown target SHA256: a92dc3d677954deff41e8e1ebafc53a16e6e626a13b86214a4b73c95250890a4

### Proposed decision

```json
{
  "claimId": "claim_9cc9ee0dd6aa0130e4bf5042b51fb600",
  "sourceUnitDigest": "a92dc3d677954deff41e8e1ebafc53a16e6e626a13b86214a4b73c95250890a4",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-81",
  "targetUnitDigest": "a92dc3d677954deff41e8e1ebafc53a16e6e626a13b86214a4b73c95250890a4",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "9. Resolver"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-78 (lines 334–334) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-81 (lines 358–358); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The resolver must distinguish read forgiveness from write strictness. Alias resolution is allowed for reads. It is refused for new writes.
```

### Full target shown text

```text
The resolver must distinguish read forgiveness from write strictness. Alias resolution is allowed for reads. It is refused for new writes.
```

## claim_e69127c129067415786f29675ab7d20a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#10-projections, lines 336–336.
Target: docs/platform/proposals/knowledge-registry-redesign.md#10-projections.
Source digest: 6b2d63a38c4d47b0450e3c6ae5287e8092881a05b3113b1926aedc42692475c2
Target digest: 6b2d63a38c4d47b0450e3c6ae5287e8092881a05b3113b1926aedc42692475c2
Shown source SHA256: ea8c1f249891eb531134ef2835f45a85403206d70a77f34612a70cf8b4e67f76
Shown target SHA256: ea8c1f249891eb531134ef2835f45a85403206d70a77f34612a70cf8b4e67f76

### Proposed decision

```json
{
  "claimId": "claim_e69127c129067415786f29675ab7d20a",
  "sourceUnitDigest": "6b2d63a38c4d47b0450e3c6ae5287e8092881a05b3113b1926aedc42692475c2",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "10-projections",
  "targetUnitDigest": "6b2d63a38c4d47b0450e3c6ae5287e8092881a05b3113b1926aedc42692475c2",
  "targetAncestry": [
    "Knowledge Registry Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#10-projections (lines 336–336) is carried at docs/platform/proposals/knowledge-registry-redesign.md#10-projections (lines 360–360); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 10. Projections

The registry has two required snapshots.
```

### Full target shown text

```text
## 10. Projections

The registry has two required snapshots.
```

## claim_8620795d9aa1ce5ec9442701d17c880d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-79, lines 338–338.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-82.
Source digest: 4058fdb8d9c3e3bb06308e1fb64a1d4b9d8d246580042bc0aa4891498d7a2c50
Target digest: 4058fdb8d9c3e3bb06308e1fb64a1d4b9d8d246580042bc0aa4891498d7a2c50
Shown source SHA256: 4058fdb8d9c3e3bb06308e1fb64a1d4b9d8d246580042bc0aa4891498d7a2c50
Shown target SHA256: 4058fdb8d9c3e3bb06308e1fb64a1d4b9d8d246580042bc0aa4891498d7a2c50

### Proposed decision

```json
{
  "claimId": "claim_8620795d9aa1ce5ec9442701d17c880d",
  "sourceUnitDigest": "4058fdb8d9c3e3bb06308e1fb64a1d4b9d8d246580042bc0aa4891498d7a2c50",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-82",
  "targetUnitDigest": "4058fdb8d9c3e3bb06308e1fb64a1d4b9d8d246580042bc0aa4891498d7a2c50",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "10. Projections"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-79 (lines 338–338) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-82 (lines 362–362); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The registry has two required snapshots.
```

### Full target shown text

```text
The registry has two required snapshots.
```

## claim_bbeca6602b5966994c8a43f5dad2e574

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#101-machine-projection, lines 340–340.
Target: docs/platform/proposals/knowledge-registry-redesign.md#101-machine-projection.
Source digest: 4c1a6d5f0d31bbe45772075650fe021b7c76d0c5a991b3e40283743d6b47794b
Target digest: 4c1a6d5f0d31bbe45772075650fe021b7c76d0c5a991b3e40283743d6b47794b
Shown source SHA256: 9e4ed3838c1ab966c71c7bcca613cba5d47c466f401215664873b58fb3bd6a31
Shown target SHA256: 9e4ed3838c1ab966c71c7bcca613cba5d47c466f401215664873b58fb3bd6a31

### Proposed decision

```json
{
  "claimId": "claim_bbeca6602b5966994c8a43f5dad2e574",
  "sourceUnitDigest": "4c1a6d5f0d31bbe45772075650fe021b7c76d0c5a991b3e40283743d6b47794b",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "101-machine-projection",
  "targetUnitDigest": "4c1a6d5f0d31bbe45772075650fe021b7c76d0c5a991b3e40283743d6b47794b",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "10. Projections"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#101-machine-projection (lines 340–340) is carried at docs/platform/proposals/knowledge-registry-redesign.md#101-machine-projection (lines 364–364); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 10.1 Machine Projection

`docs/knowledge-registry.json` is the machine-readable projection. It is derived and overwritten, not edited by hand.

It contains:

- role vocabulary;
- topics;
- documents;
- aliases;
- lineage;
- lifecycle;
- source reachability summary;
- generated timestamp or projection version if the repo's projection convention allows it.
```

### Full target shown text

```text
### 10.1 Machine Projection

`docs/knowledge-registry.json` is the machine-readable projection. It is derived and overwritten, not edited by hand.

It contains:

- role vocabulary;
- topics;
- documents;
- aliases;
- lineage;
- lifecycle;
- source reachability summary;
- generated timestamp or projection version if the repo's projection convention allows it.
```

## claim_458ec3062788baf8d5177ad0e5b4b646

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-80, lines 342–342.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-83.
Source digest: 45c4ce3c533206bd50607f5b6e2fa0570718066e72d9311d030a7dcb8f477b1a
Target digest: 45c4ce3c533206bd50607f5b6e2fa0570718066e72d9311d030a7dcb8f477b1a
Shown source SHA256: 45c4ce3c533206bd50607f5b6e2fa0570718066e72d9311d030a7dcb8f477b1a
Shown target SHA256: 45c4ce3c533206bd50607f5b6e2fa0570718066e72d9311d030a7dcb8f477b1a

### Proposed decision

```json
{
  "claimId": "claim_458ec3062788baf8d5177ad0e5b4b646",
  "sourceUnitDigest": "45c4ce3c533206bd50607f5b6e2fa0570718066e72d9311d030a7dcb8f477b1a",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-83",
  "targetUnitDigest": "45c4ce3c533206bd50607f5b6e2fa0570718066e72d9311d030a7dcb8f477b1a",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "10. Projections",
    "10.1 Machine Projection"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-80 (lines 342–342) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-83 (lines 366–366); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`docs/knowledge-registry.json` is the machine-readable projection. It is derived and overwritten, not edited by hand.
```

### Full target shown text

```text
`docs/knowledge-registry.json` is the machine-readable projection. It is derived and overwritten, not edited by hand.
```

## claim_041579def58efe204acdef7e9fc1c1ac

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-81, lines 344–353.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-84.
Source digest: 43a3f0d38467475d663d272ece3aff8e627f26cf3336eae31ef1429c9daa378c
Target digest: 43a3f0d38467475d663d272ece3aff8e627f26cf3336eae31ef1429c9daa378c
Shown source SHA256: 43a3f0d38467475d663d272ece3aff8e627f26cf3336eae31ef1429c9daa378c
Shown target SHA256: 43a3f0d38467475d663d272ece3aff8e627f26cf3336eae31ef1429c9daa378c

### Proposed decision

```json
{
  "claimId": "claim_041579def58efe204acdef7e9fc1c1ac",
  "sourceUnitDigest": "43a3f0d38467475d663d272ece3aff8e627f26cf3336eae31ef1429c9daa378c",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-84",
  "targetUnitDigest": "43a3f0d38467475d663d272ece3aff8e627f26cf3336eae31ef1429c9daa378c",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "10. Projections",
    "10.1 Machine Projection"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-81 (lines 344–353) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-84 (lines 368–377); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
It contains:

- role vocabulary;
- topics;
- documents;
- aliases;
- lineage;
- lifecycle;
- source reachability summary;
- generated timestamp or projection version if the repo's projection convention allows it.
```

### Full target shown text

```text
It contains:

- role vocabulary;
- topics;
- documents;
- aliases;
- lineage;
- lifecycle;
- source reachability summary;
- generated timestamp or projection version if the repo's projection convention allows it.
```

## claim_66efc8e7db214efb5cd3ce846190bad9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#102-human-projection, lines 355–355.
Target: docs/platform/proposals/knowledge-registry-redesign.md#102-human-projection.
Source digest: 769a5cebe0c52e15f39c802fd1fd2d7a1ae7d02d1ffc41c189d55b90b8b86bfb
Target digest: 769a5cebe0c52e15f39c802fd1fd2d7a1ae7d02d1ffc41c189d55b90b8b86bfb
Shown source SHA256: d9c3c8091c8855facb809fe069e377fead890ee7b71d9e4f8d4ff3b7334479af
Shown target SHA256: d9c3c8091c8855facb809fe069e377fead890ee7b71d9e4f8d4ff3b7334479af

### Proposed decision

```json
{
  "claimId": "claim_66efc8e7db214efb5cd3ce846190bad9",
  "sourceUnitDigest": "769a5cebe0c52e15f39c802fd1fd2d7a1ae7d02d1ffc41c189d55b90b8b86bfb",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "102-human-projection",
  "targetUnitDigest": "769a5cebe0c52e15f39c802fd1fd2d7a1ae7d02d1ffc41c189d55b90b8b86bfb",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "10. Projections"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#102-human-projection (lines 355–355) is carried at docs/platform/proposals/knowledge-registry-redesign.md#102-human-projection (lines 379–379); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 10.2 Human Projection

`docs/knowledge-registry.md` is the human-readable projection. It must show what `ls docs/` cannot:

- topics registered without documents;
- reserved documents without rendered prose;
- provisional documents waiting for promotion;
- active documents per topic and role;
- aliases from old paths;
- topic split/merge/rename lineage;
- retired topics and successors;
- topics over size thresholds;
- suspicious roles with too little usage;
- near-duplicate topics or documents.

The Markdown projection is not a second source of truth.
```

### Full target shown text

```text
### 10.2 Human Projection

`docs/knowledge-registry.md` is the human-readable projection. It must show what `ls docs/` cannot:

- topics registered without documents;
- reserved documents without rendered prose;
- provisional documents waiting for promotion;
- active documents per topic and role;
- aliases from old paths;
- topic split/merge/rename lineage;
- retired topics and successors;
- topics over size thresholds;
- suspicious roles with too little usage;
- near-duplicate topics or documents.

The Markdown projection is not a second source of truth.
```

## claim_c4e615c4c62feb8d00974eeac11063c9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-82, lines 357–357.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-85.
Source digest: e7ee88bac8f4b07f646a9cc5a681de18ec275e508d53cc7ecdbdf805dcaa99bd
Target digest: e7ee88bac8f4b07f646a9cc5a681de18ec275e508d53cc7ecdbdf805dcaa99bd
Shown source SHA256: e7ee88bac8f4b07f646a9cc5a681de18ec275e508d53cc7ecdbdf805dcaa99bd
Shown target SHA256: e7ee88bac8f4b07f646a9cc5a681de18ec275e508d53cc7ecdbdf805dcaa99bd

### Proposed decision

```json
{
  "claimId": "claim_c4e615c4c62feb8d00974eeac11063c9",
  "sourceUnitDigest": "e7ee88bac8f4b07f646a9cc5a681de18ec275e508d53cc7ecdbdf805dcaa99bd",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-85",
  "targetUnitDigest": "e7ee88bac8f4b07f646a9cc5a681de18ec275e508d53cc7ecdbdf805dcaa99bd",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "10. Projections",
    "10.2 Human Projection"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-82 (lines 357–357) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-85 (lines 381–381); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`docs/knowledge-registry.md` is the human-readable projection. It must show what `ls docs/` cannot:
```

### Full target shown text

```text
`docs/knowledge-registry.md` is the human-readable projection. It must show what `ls docs/` cannot:
```

## claim_94a2db9dd2b550036b601de83dfb3663

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-83, lines 359–368.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-86.
Source digest: 930209fab70f92c7ca5bd2145549d35f843bd2cb1ad49416a2553dd50633356c
Target digest: 930209fab70f92c7ca5bd2145549d35f843bd2cb1ad49416a2553dd50633356c
Shown source SHA256: 930209fab70f92c7ca5bd2145549d35f843bd2cb1ad49416a2553dd50633356c
Shown target SHA256: 930209fab70f92c7ca5bd2145549d35f843bd2cb1ad49416a2553dd50633356c

### Proposed decision

```json
{
  "claimId": "claim_94a2db9dd2b550036b601de83dfb3663",
  "sourceUnitDigest": "930209fab70f92c7ca5bd2145549d35f843bd2cb1ad49416a2553dd50633356c",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-86",
  "targetUnitDigest": "930209fab70f92c7ca5bd2145549d35f843bd2cb1ad49416a2553dd50633356c",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "10. Projections",
    "10.2 Human Projection"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-83 (lines 359–368) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-86 (lines 383–392); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- topics registered without documents;
- reserved documents without rendered prose;
- provisional documents waiting for promotion;
- active documents per topic and role;
- aliases from old paths;
- topic split/merge/rename lineage;
- retired topics and successors;
- topics over size thresholds;
- suspicious roles with too little usage;
- near-duplicate topics or documents.
```

### Full target shown text

```text
- topics registered without documents;
- reserved documents without rendered prose;
- provisional documents waiting for promotion;
- active documents per topic and role;
- aliases from old paths;
- topic split/merge/rename lineage;
- retired topics and successors;
- topics over size thresholds;
- suspicious roles with too little usage;
- near-duplicate topics or documents.
```

## claim_e461fe054346768ef9709fe9a3ae52a7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-84, lines 370–370.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-87.
Source digest: 00a2475a5e24499ddaf61c8cd1ccf2f1dac92f89e67bca42ab4b49ec074eb3ec
Target digest: 00a2475a5e24499ddaf61c8cd1ccf2f1dac92f89e67bca42ab4b49ec074eb3ec
Shown source SHA256: 00a2475a5e24499ddaf61c8cd1ccf2f1dac92f89e67bca42ab4b49ec074eb3ec
Shown target SHA256: 00a2475a5e24499ddaf61c8cd1ccf2f1dac92f89e67bca42ab4b49ec074eb3ec

### Proposed decision

```json
{
  "claimId": "claim_e461fe054346768ef9709fe9a3ae52a7",
  "sourceUnitDigest": "00a2475a5e24499ddaf61c8cd1ccf2f1dac92f89e67bca42ab4b49ec074eb3ec",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-87",
  "targetUnitDigest": "00a2475a5e24499ddaf61c8cd1ccf2f1dac92f89e67bca42ab4b49ec074eb3ec",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "10. Projections",
    "10.2 Human Projection"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-84 (lines 370–370) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-87 (lines 394–394); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The Markdown projection is not a second source of truth.
```

### Full target shown text

```text
The Markdown projection is not a second source of truth.
```

## claim_c08b65f2d54f84b406b21fa5ac426329

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#11-correct-implementation-order, lines 372–372.
Target: docs/platform/proposals/knowledge-registry-redesign.md#11-correct-implementation-order.
Source digest: a4c786a1115341e3bf29d56f476260bb1f3713525399effe1bc96df9fdebf204
Target digest: a4c786a1115341e3bf29d56f476260bb1f3713525399effe1bc96df9fdebf204
Shown source SHA256: a877873d2a3fc1ae0df765b8da00b45f5eb83319d39c35f6e9dc2aa320025063
Shown target SHA256: a877873d2a3fc1ae0df765b8da00b45f5eb83319d39c35f6e9dc2aa320025063

### Proposed decision

```json
{
  "claimId": "claim_c08b65f2d54f84b406b21fa5ac426329",
  "sourceUnitDigest": "a4c786a1115341e3bf29d56f476260bb1f3713525399effe1bc96df9fdebf204",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "11-correct-implementation-order",
  "targetUnitDigest": "a4c786a1115341e3bf29d56f476260bb1f3713525399effe1bc96df9fdebf204",
  "targetAncestry": [
    "Knowledge Registry Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#11-correct-implementation-order (lines 372–372) is carried at docs/platform/proposals/knowledge-registry-redesign.md#11-correct-implementation-order (lines 396–396); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 11. Correct Implementation Order

The order matters because registry bootstrap needs classification output.
```

### Full target shown text

```text
## 11. Correct Implementation Order

The order matters because registry bootstrap needs classification output.
```

## claim_49a9036b94b327a3243a0427920bf8cc

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-85, lines 374–374.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-88.
Source digest: 5d353e7eba95b64219ff68c2b36d74f47b7349707d59b8aa42db6e37dca59f48
Target digest: 5d353e7eba95b64219ff68c2b36d74f47b7349707d59b8aa42db6e37dca59f48
Shown source SHA256: 5d353e7eba95b64219ff68c2b36d74f47b7349707d59b8aa42db6e37dca59f48
Shown target SHA256: 5d353e7eba95b64219ff68c2b36d74f47b7349707d59b8aa42db6e37dca59f48

### Proposed decision

```json
{
  "claimId": "claim_49a9036b94b327a3243a0427920bf8cc",
  "sourceUnitDigest": "5d353e7eba95b64219ff68c2b36d74f47b7349707d59b8aa42db6e37dca59f48",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-88",
  "targetUnitDigest": "5d353e7eba95b64219ff68c2b36d74f47b7349707d59b8aa42db6e37dca59f48",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "11. Correct Implementation Order"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-85 (lines 374–374) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-88 (lines 398–398); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The order matters because registry bootstrap needs classification output.
```

### Full target shown text

```text
The order matters because registry bootstrap needs classification output.
```

## claim_415763049d59b4e553b1f497cf19365c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#111-dependency-rule, lines 376–376.
Target: docs/platform/proposals/knowledge-registry-redesign.md#111-dependency-rule.
Source digest: a3bdbf443d2862ebe171a21649a2421b335dc5e0180aaa2be1bea44e86300b9c
Target digest: a3bdbf443d2862ebe171a21649a2421b335dc5e0180aaa2be1bea44e86300b9c
Shown source SHA256: 974e988f2696c88ce6e54da9ea497d799b103e796e934a8daef19f492676c57b
Shown target SHA256: 974e988f2696c88ce6e54da9ea497d799b103e796e934a8daef19f492676c57b

### Proposed decision

```json
{
  "claimId": "claim_415763049d59b4e553b1f497cf19365c",
  "sourceUnitDigest": "a3bdbf443d2862ebe171a21649a2421b335dc5e0180aaa2be1bea44e86300b9c",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "111-dependency-rule",
  "targetUnitDigest": "a3bdbf443d2862ebe171a21649a2421b335dc5e0180aaa2be1bea44e86300b9c",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "11. Correct Implementation Order"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#111-dependency-rule (lines 376–376) is carried at docs/platform/proposals/knowledge-registry-redesign.md#111-dependency-rule (lines 400–400); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 11.1 Dependency Rule

Before splitting two plan steps apart, ask:

```txt
Is the output of one step mandatory input to the other?
```

If yes, the steps must be adjacent or treated as one unit.

This applies directly here: bootstrapping a registry row for an old document requires `topicId`, `purposeSlug`, `role`, `entities`, `framework`, and `mode`. Those values are the classifier's output. Therefore classifier/inventory must run before bootstrap.
````

### Full target shown text

````text
### 11.1 Dependency Rule

Before splitting two plan steps apart, ask:

```txt
Is the output of one step mandatory input to the other?
```

If yes, the steps must be adjacent or treated as one unit.

This applies directly here: bootstrapping a registry row for an old document requires `topicId`, `purposeSlug`, `role`, `entities`, `framework`, and `mode`. Those values are the classifier's output. Therefore classifier/inventory must run before bootstrap.
````

## claim_7cf69b3e7db90e79dc86fcdcc8d72c49

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-86, lines 378–378.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-89.
Source digest: 721b2c46fee317ac0c584e5d57effe6f51098dbad2dae05f6c7fd26b7f04312f
Target digest: 721b2c46fee317ac0c584e5d57effe6f51098dbad2dae05f6c7fd26b7f04312f
Shown source SHA256: 721b2c46fee317ac0c584e5d57effe6f51098dbad2dae05f6c7fd26b7f04312f
Shown target SHA256: 721b2c46fee317ac0c584e5d57effe6f51098dbad2dae05f6c7fd26b7f04312f

### Proposed decision

```json
{
  "claimId": "claim_7cf69b3e7db90e79dc86fcdcc8d72c49",
  "sourceUnitDigest": "721b2c46fee317ac0c584e5d57effe6f51098dbad2dae05f6c7fd26b7f04312f",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-89",
  "targetUnitDigest": "721b2c46fee317ac0c584e5d57effe6f51098dbad2dae05f6c7fd26b7f04312f",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "11. Correct Implementation Order",
    "11.1 Dependency Rule"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-86 (lines 378–378) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-89 (lines 402–402); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Before splitting two plan steps apart, ask:
```

### Full target shown text

```text
Before splitting two plan steps apart, ask:
```

## claim_22211126c08f8b88863c6d091762e4af

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-87, lines 380–382.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-90.
Source digest: 0aac7bd31a1713c003e1c10eb9613f2c08d55442e19bb7a2db2024bc1b35e116
Target digest: 0aac7bd31a1713c003e1c10eb9613f2c08d55442e19bb7a2db2024bc1b35e116
Shown source SHA256: 0aac7bd31a1713c003e1c10eb9613f2c08d55442e19bb7a2db2024bc1b35e116
Shown target SHA256: 0aac7bd31a1713c003e1c10eb9613f2c08d55442e19bb7a2db2024bc1b35e116

### Proposed decision

```json
{
  "claimId": "claim_22211126c08f8b88863c6d091762e4af",
  "sourceUnitDigest": "0aac7bd31a1713c003e1c10eb9613f2c08d55442e19bb7a2db2024bc1b35e116",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-90",
  "targetUnitDigest": "0aac7bd31a1713c003e1c10eb9613f2c08d55442e19bb7a2db2024bc1b35e116",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "11. Correct Implementation Order",
    "11.1 Dependency Rule"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-87 (lines 380–382) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-90 (lines 404–406); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
Is the output of one step mandatory input to the other?
```
````

### Full target shown text

````text
```txt
Is the output of one step mandatory input to the other?
```
````

## claim_fdbb0413ca09ba48668d90511b20676e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-88, lines 384–384.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-91.
Source digest: d5382a7930d9bf40d75f29fa577382bf5677ea1c9319dbba4166916c2fd3ce26
Target digest: d5382a7930d9bf40d75f29fa577382bf5677ea1c9319dbba4166916c2fd3ce26
Shown source SHA256: d5382a7930d9bf40d75f29fa577382bf5677ea1c9319dbba4166916c2fd3ce26
Shown target SHA256: d5382a7930d9bf40d75f29fa577382bf5677ea1c9319dbba4166916c2fd3ce26

### Proposed decision

```json
{
  "claimId": "claim_fdbb0413ca09ba48668d90511b20676e",
  "sourceUnitDigest": "d5382a7930d9bf40d75f29fa577382bf5677ea1c9319dbba4166916c2fd3ce26",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-91",
  "targetUnitDigest": "d5382a7930d9bf40d75f29fa577382bf5677ea1c9319dbba4166916c2fd3ce26",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "11. Correct Implementation Order",
    "11.1 Dependency Rule"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-88 (lines 384–384) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-91 (lines 408–408); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
If yes, the steps must be adjacent or treated as one unit.
```

### Full target shown text

```text
If yes, the steps must be adjacent or treated as one unit.
```

## claim_9a6f4153d200f46a63ad9f4d5f864d0f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-89, lines 386–386.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-92.
Source digest: 3124dc4717ca510c3390802e6a7f1432a3d299f068f69bf9f7295ae00581b424
Target digest: 3124dc4717ca510c3390802e6a7f1432a3d299f068f69bf9f7295ae00581b424
Shown source SHA256: 3124dc4717ca510c3390802e6a7f1432a3d299f068f69bf9f7295ae00581b424
Shown target SHA256: 3124dc4717ca510c3390802e6a7f1432a3d299f068f69bf9f7295ae00581b424

### Proposed decision

```json
{
  "claimId": "claim_9a6f4153d200f46a63ad9f4d5f864d0f",
  "sourceUnitDigest": "3124dc4717ca510c3390802e6a7f1432a3d299f068f69bf9f7295ae00581b424",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-92",
  "targetUnitDigest": "3124dc4717ca510c3390802e6a7f1432a3d299f068f69bf9f7295ae00581b424",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "11. Correct Implementation Order",
    "11.1 Dependency Rule"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-89 (lines 386–386) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-92 (lines 410–410); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
This applies directly here: bootstrapping a registry row for an old document requires `topicId`, `purposeSlug`, `role`, `entities`, `framework`, and `mode`. Those values are the classifier's output. Therefore classifier/inventory must run before bootstrap.
```

### Full target shown text

```text
This applies directly here: bootstrapping a registry row for an old document requires `topicId`, `purposeSlug`, `role`, `entities`, `framework`, and `mode`. Those values are the classifier's output. Therefore classifier/inventory must run before bootstrap.
```

## claim_84d0028e028eed7db45c0396adae3b07

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#112-sequence, lines 388–388.
Target: docs/platform/proposals/knowledge-registry-redesign.md#112-sequence.
Source digest: 0a7205af2c39bd8b8fdd78c29ad4f7c949f801ee28ec4f32d86dbddc84786924
Target digest: 0a7205af2c39bd8b8fdd78c29ad4f7c949f801ee28ec4f32d86dbddc84786924
Shown source SHA256: cfe44e637d43b7cc93b4a787519674abc53586728ad711f3dddf5fa208d66e8b
Shown target SHA256: cfe44e637d43b7cc93b4a787519674abc53586728ad711f3dddf5fa208d66e8b

### Proposed decision

```json
{
  "claimId": "claim_84d0028e028eed7db45c0396adae3b07",
  "sourceUnitDigest": "0a7205af2c39bd8b8fdd78c29ad4f7c949f801ee28ec4f32d86dbddc84786924",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "112-sequence",
  "targetUnitDigest": "0a7205af2c39bd8b8fdd78c29ad4f7c949f801ee28ec4f32d86dbddc84786924",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "11. Correct Implementation Order"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#112-sequence (lines 388–388) is carried at docs/platform/proposals/knowledge-registry-redesign.md#112-sequence (lines 412–412); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 11.2 Sequence

1. Build the registry model and reducer with invariant tests.
2. Build the resolver and alias model with read/write distinction tests.
3. Run classifier/inventory as a read-only pass over the existing corpus. Output one proposed registry row per old file, including `currentPath`, `topicId`, `purposeSlug`, `role`, `entities`, `framework`, `mode`, and proposed target path.
4. Bootstrap the registry from the classifier/inventory output. At this point, the registry can represent all existing files without moving them.
5. Add and enable the producer registry gate: attestation and the legacy compound path refuse any new path that is not a registered current path.
6. Update read surfaces such as document-source lookup and document index generation to use the resolver.
7. Update the writer skill/process to be registry-first: route to topic and role, reserve if needed, write, attest, mark rendered.
8. Run a writer canary outside the migration.
9. Run migration dry-run and conservation checks.
10. Apply the migration: move/fold files by target topic/document, update aliases, regenerate projections.
11. Run full harness and doctor checks.

The key safety property is that enforcement is enabled before files are moved into the new layout. There is no window where old writer logic can create new official paths in a freshly cleaned tree.
```

### Full target shown text

```text
### 11.2 Sequence

1. Build the registry model and reducer with invariant tests.
2. Build the resolver and alias model with read/write distinction tests.
3. Run classifier/inventory as a read-only pass over the existing corpus. Output one proposed registry row per old file, including `currentPath`, `topicId`, `purposeSlug`, `role`, `entities`, `framework`, `mode`, and proposed target path.
4. Bootstrap the registry from the classifier/inventory output. At this point, the registry can represent all existing files without moving them.
5. Add and enable the producer registry gate: attestation and the legacy compound path refuse any new path that is not a registered current path.
6. Update read surfaces such as document-source lookup and document index generation to use the resolver.
7. Update the writer skill/process to be registry-first: route to topic and role, reserve if needed, write, attest, mark rendered.
8. Run a writer canary outside the migration.
9. Run migration dry-run and conservation checks.
10. Apply the migration: move/fold files by target topic/document, update aliases, regenerate projections.
11. Run full harness and doctor checks.

The key safety property is that enforcement is enabled before files are moved into the new layout. There is no window where old writer logic can create new official paths in a freshly cleaned tree.
```

## claim_854d7d8c521aa1091279f9897c910630

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-90, lines 390–400.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-93.
Source digest: 609221106d26a2a647c35836f7b5584b4f62ccfb2b5e7e2aae87315c326ba318
Target digest: 609221106d26a2a647c35836f7b5584b4f62ccfb2b5e7e2aae87315c326ba318
Shown source SHA256: 609221106d26a2a647c35836f7b5584b4f62ccfb2b5e7e2aae87315c326ba318
Shown target SHA256: 609221106d26a2a647c35836f7b5584b4f62ccfb2b5e7e2aae87315c326ba318

### Proposed decision

```json
{
  "claimId": "claim_854d7d8c521aa1091279f9897c910630",
  "sourceUnitDigest": "609221106d26a2a647c35836f7b5584b4f62ccfb2b5e7e2aae87315c326ba318",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-93",
  "targetUnitDigest": "609221106d26a2a647c35836f7b5584b4f62ccfb2b5e7e2aae87315c326ba318",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "11. Correct Implementation Order",
    "11.2 Sequence"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-90 (lines 390–400) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-93 (lines 414–424); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
1. Build the registry model and reducer with invariant tests.
2. Build the resolver and alias model with read/write distinction tests.
3. Run classifier/inventory as a read-only pass over the existing corpus. Output one proposed registry row per old file, including `currentPath`, `topicId`, `purposeSlug`, `role`, `entities`, `framework`, `mode`, and proposed target path.
4. Bootstrap the registry from the classifier/inventory output. At this point, the registry can represent all existing files without moving them.
5. Add and enable the producer registry gate: attestation and the legacy compound path refuse any new path that is not a registered current path.
6. Update read surfaces such as document-source lookup and document index generation to use the resolver.
7. Update the writer skill/process to be registry-first: route to topic and role, reserve if needed, write, attest, mark rendered.
8. Run a writer canary outside the migration.
9. Run migration dry-run and conservation checks.
10. Apply the migration: move/fold files by target topic/document, update aliases, regenerate projections.
11. Run full harness and doctor checks.
```

### Full target shown text

```text
1. Build the registry model and reducer with invariant tests.
2. Build the resolver and alias model with read/write distinction tests.
3. Run classifier/inventory as a read-only pass over the existing corpus. Output one proposed registry row per old file, including `currentPath`, `topicId`, `purposeSlug`, `role`, `entities`, `framework`, `mode`, and proposed target path.
4. Bootstrap the registry from the classifier/inventory output. At this point, the registry can represent all existing files without moving them.
5. Add and enable the producer registry gate: attestation and the legacy compound path refuse any new path that is not a registered current path.
6. Update read surfaces such as document-source lookup and document index generation to use the resolver.
7. Update the writer skill/process to be registry-first: route to topic and role, reserve if needed, write, attest, mark rendered.
8. Run a writer canary outside the migration.
9. Run migration dry-run and conservation checks.
10. Apply the migration: move/fold files by target topic/document, update aliases, regenerate projections.
11. Run full harness and doctor checks.
```

## claim_9420363b59a42df83ee98b4850fe4bf9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-91, lines 402–402.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-94.
Source digest: 0798d7cd028911c418e015ec6276c12f7b7245d57c8f6c5bdb82780653f2b076
Target digest: 0798d7cd028911c418e015ec6276c12f7b7245d57c8f6c5bdb82780653f2b076
Shown source SHA256: 0798d7cd028911c418e015ec6276c12f7b7245d57c8f6c5bdb82780653f2b076
Shown target SHA256: 0798d7cd028911c418e015ec6276c12f7b7245d57c8f6c5bdb82780653f2b076

### Proposed decision

```json
{
  "claimId": "claim_9420363b59a42df83ee98b4850fe4bf9",
  "sourceUnitDigest": "0798d7cd028911c418e015ec6276c12f7b7245d57c8f6c5bdb82780653f2b076",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-94",
  "targetUnitDigest": "0798d7cd028911c418e015ec6276c12f7b7245d57c8f6c5bdb82780653f2b076",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "11. Correct Implementation Order",
    "11.2 Sequence"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-91 (lines 402–402) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-94 (lines 426–426); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The key safety property is that enforcement is enabled before files are moved into the new layout. There is no window where old writer logic can create new official paths in a freshly cleaned tree.
```

### Full target shown text

```text
The key safety property is that enforcement is enabled before files are moved into the new layout. There is no window where old writer logic can create new official paths in a freshly cleaned tree.
```

## claim_969e818360245040a6e6b6ff8684fdf9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#12-writer-flow, lines 404–404.
Target: docs/platform/proposals/knowledge-registry-redesign.md#12-writer-flow.
Source digest: 10b87bf028d7da786ba95ab2fd1006f28953cafa6774c83445c5fe01770ed9ee
Target digest: 10b87bf028d7da786ba95ab2fd1006f28953cafa6774c83445c5fe01770ed9ee
Shown source SHA256: f9e693786d86ad02823ec6c0810dc6290f5e1d0af8cbdf0e8ced15d497c53f39
Shown target SHA256: f9e693786d86ad02823ec6c0810dc6290f5e1d0af8cbdf0e8ced15d497c53f39

### Proposed decision

```json
{
  "claimId": "claim_969e818360245040a6e6b6ff8684fdf9",
  "sourceUnitDigest": "10b87bf028d7da786ba95ab2fd1006f28953cafa6774c83445c5fe01770ed9ee",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "12-writer-flow",
  "targetUnitDigest": "10b87bf028d7da786ba95ab2fd1006f28953cafa6774c83445c5fe01770ed9ee",
  "targetAncestry": [
    "Knowledge Registry Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#12-writer-flow (lines 404–404) is carried at docs/platform/proposals/knowledge-registry-redesign.md#12-writer-flow (lines 428–428); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 12. Writer Flow

The writer process becomes:

1. Gather capture and material from the retrospective item.
2. Classify the material into topic, role, entities, framework, and mode.
3. Resolve the target document slot.
4. If the topic exists and the role slot exists, grow the existing document.
5. If the topic exists and the role slot does not exist, reserve the document slot before writing.
6. If the topic does not exist, create a proposal or require `topic register`; do not silently create an active official topic.
7. Write or grow prose at the document's `currentPath`.
8. Commit the prose before attestation.
9. Attest the capture to the registered current path.
10. Mark the document rendered.
11. Promote only through `fgos doc promote` when policy allows it.

The writer never chooses a free-form path and then asks the producer to accept it. Path comes from the registry.
```

### Full target shown text

```text
## 12. Writer Flow

The writer process becomes:

1. Gather capture and material from the retrospective item.
2. Classify the material into topic, role, entities, framework, and mode.
3. Resolve the target document slot.
4. If the topic exists and the role slot exists, grow the existing document.
5. If the topic exists and the role slot does not exist, reserve the document slot before writing.
6. If the topic does not exist, create a proposal or require `topic register`; do not silently create an active official topic.
7. Write or grow prose at the document's `currentPath`.
8. Commit the prose before attestation.
9. Attest the capture to the registered current path.
10. Mark the document rendered.
11. Promote only through `fgos doc promote` when policy allows it.

The writer never chooses a free-form path and then asks the producer to accept it. Path comes from the registry.
```

## claim_b3d06fbadeb805d141bb2de400d2d0b0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-92, lines 406–406.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-95.
Source digest: 85110b28781aaec9cc76df93dc49ba4ec7658c40980ce8e25fd6537bc0fd696f
Target digest: 85110b28781aaec9cc76df93dc49ba4ec7658c40980ce8e25fd6537bc0fd696f
Shown source SHA256: 85110b28781aaec9cc76df93dc49ba4ec7658c40980ce8e25fd6537bc0fd696f
Shown target SHA256: 85110b28781aaec9cc76df93dc49ba4ec7658c40980ce8e25fd6537bc0fd696f

### Proposed decision

```json
{
  "claimId": "claim_b3d06fbadeb805d141bb2de400d2d0b0",
  "sourceUnitDigest": "85110b28781aaec9cc76df93dc49ba4ec7658c40980ce8e25fd6537bc0fd696f",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-95",
  "targetUnitDigest": "85110b28781aaec9cc76df93dc49ba4ec7658c40980ce8e25fd6537bc0fd696f",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "12. Writer Flow"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-92 (lines 406–406) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-95 (lines 430–430); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The writer process becomes:
```

### Full target shown text

```text
The writer process becomes:
```

## claim_e48fe0bfcb0954db36f31229f66d80c9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-93, lines 408–418.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-96.
Source digest: f03468eb217831f877a83d25776766d9f548f67c7f0c420570b34384c36ff015
Target digest: f03468eb217831f877a83d25776766d9f548f67c7f0c420570b34384c36ff015
Shown source SHA256: f03468eb217831f877a83d25776766d9f548f67c7f0c420570b34384c36ff015
Shown target SHA256: f03468eb217831f877a83d25776766d9f548f67c7f0c420570b34384c36ff015

### Proposed decision

```json
{
  "claimId": "claim_e48fe0bfcb0954db36f31229f66d80c9",
  "sourceUnitDigest": "f03468eb217831f877a83d25776766d9f548f67c7f0c420570b34384c36ff015",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-96",
  "targetUnitDigest": "f03468eb217831f877a83d25776766d9f548f67c7f0c420570b34384c36ff015",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "12. Writer Flow"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-93 (lines 408–418) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-96 (lines 432–442); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
1. Gather capture and material from the retrospective item.
2. Classify the material into topic, role, entities, framework, and mode.
3. Resolve the target document slot.
4. If the topic exists and the role slot exists, grow the existing document.
5. If the topic exists and the role slot does not exist, reserve the document slot before writing.
6. If the topic does not exist, create a proposal or require `topic register`; do not silently create an active official topic.
7. Write or grow prose at the document's `currentPath`.
8. Commit the prose before attestation.
9. Attest the capture to the registered current path.
10. Mark the document rendered.
11. Promote only through `fgos doc promote` when policy allows it.
```

### Full target shown text

```text
1. Gather capture and material from the retrospective item.
2. Classify the material into topic, role, entities, framework, and mode.
3. Resolve the target document slot.
4. If the topic exists and the role slot exists, grow the existing document.
5. If the topic exists and the role slot does not exist, reserve the document slot before writing.
6. If the topic does not exist, create a proposal or require `topic register`; do not silently create an active official topic.
7. Write or grow prose at the document's `currentPath`.
8. Commit the prose before attestation.
9. Attest the capture to the registered current path.
10. Mark the document rendered.
11. Promote only through `fgos doc promote` when policy allows it.
```

## claim_6b37879f4837e82a2011c0143d8a9ef3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-94, lines 420–420.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-97.
Source digest: 23133d4b16f4ff296b748e3483e7b930fd964371d931688210c3a3131b6f1f2c
Target digest: 23133d4b16f4ff296b748e3483e7b930fd964371d931688210c3a3131b6f1f2c
Shown source SHA256: 23133d4b16f4ff296b748e3483e7b930fd964371d931688210c3a3131b6f1f2c
Shown target SHA256: 23133d4b16f4ff296b748e3483e7b930fd964371d931688210c3a3131b6f1f2c

### Proposed decision

```json
{
  "claimId": "claim_6b37879f4837e82a2011c0143d8a9ef3",
  "sourceUnitDigest": "23133d4b16f4ff296b748e3483e7b930fd964371d931688210c3a3131b6f1f2c",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-97",
  "targetUnitDigest": "23133d4b16f4ff296b748e3483e7b930fd964371d931688210c3a3131b6f1f2c",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "12. Writer Flow"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-94 (lines 420–420) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-97 (lines 444–444); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The writer never chooses a free-form path and then asks the producer to accept it. Path comes from the registry.
```

### Full target shown text

```text
The writer never chooses a free-form path and then asks the producer to accept it. Path comes from the registry.
```

## claim_1a3084acd1209b3ddf6b4acfe562ee86

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#13-migration, lines 422–422.
Target: docs/platform/proposals/knowledge-registry-redesign.md#13-migration.
Source digest: 2b79a68c01ccaf00fe2a1020f3d824199f6f9b0a1bd80c62246472b601658a45
Target digest: 2b79a68c01ccaf00fe2a1020f3d824199f6f9b0a1bd80c62246472b601658a45
Shown source SHA256: 334d5e9d5007c367da59291efd956b6903c33eb6a4ffb44d8d6970a127e3b5a0
Shown target SHA256: 334d5e9d5007c367da59291efd956b6903c33eb6a4ffb44d8d6970a127e3b5a0

### Proposed decision

```json
{
  "claimId": "claim_1a3084acd1209b3ddf6b4acfe562ee86",
  "sourceUnitDigest": "2b79a68c01ccaf00fe2a1020f3d824199f6f9b0a1bd80c62246472b601658a45",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "13-migration",
  "targetUnitDigest": "2b79a68c01ccaf00fe2a1020f3d824199f6f9b0a1bd80c62246472b601658a45",
  "targetAncestry": [
    "Knowledge Registry Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#13-migration (lines 422–422) is carried at docs/platform/proposals/knowledge-registry-redesign.md#13-migration (lines 446–446); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 13. Migration

Migration has two different phases.
```

### Full target shown text

```text
## 13. Migration

Migration has two different phases.
```

## claim_2e6632cda3446441b98fa7dba5a4810e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-95, lines 424–424.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-98.
Source digest: 09ae5b29324cb3c46bf46f7f3fd68e3c6b044f7a95de691180a6bd4cc5da336d
Target digest: 09ae5b29324cb3c46bf46f7f3fd68e3c6b044f7a95de691180a6bd4cc5da336d
Shown source SHA256: 09ae5b29324cb3c46bf46f7f3fd68e3c6b044f7a95de691180a6bd4cc5da336d
Shown target SHA256: 09ae5b29324cb3c46bf46f7f3fd68e3c6b044f7a95de691180a6bd4cc5da336d

### Proposed decision

```json
{
  "claimId": "claim_2e6632cda3446441b98fa7dba5a4810e",
  "sourceUnitDigest": "09ae5b29324cb3c46bf46f7f3fd68e3c6b044f7a95de691180a6bd4cc5da336d",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-98",
  "targetUnitDigest": "09ae5b29324cb3c46bf46f7f3fd68e3c6b044f7a95de691180a6bd4cc5da336d",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "13. Migration"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-95 (lines 424–424) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-98 (lines 448–448); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Migration has two different phases.
```

### Full target shown text

```text
Migration has two different phases.
```

## claim_3639ee4fc761b440b0efc33ab9525a89

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#131-classification-and-inventory, lines 426–426.
Target: docs/platform/proposals/knowledge-registry-redesign.md#131-classification-and-inventory.
Source digest: ba019034c2bf1f87df7b625db12b6cf7d6caf697784f468eb3cd164dd8d5ce49
Target digest: ba019034c2bf1f87df7b625db12b6cf7d6caf697784f468eb3cd164dd8d5ce49
Shown source SHA256: fc7078d38e03b83f101d36548a4946fcba111a484201e83c060c23baaf04e9da
Shown target SHA256: fc7078d38e03b83f101d36548a4946fcba111a484201e83c060c23baaf04e9da

### Proposed decision

```json
{
  "claimId": "claim_3639ee4fc761b440b0efc33ab9525a89",
  "sourceUnitDigest": "ba019034c2bf1f87df7b625db12b6cf7d6caf697784f468eb3cd164dd8d5ce49",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "131-classification-and-inventory",
  "targetUnitDigest": "ba019034c2bf1f87df7b625db12b6cf7d6caf697784f468eb3cd164dd8d5ce49",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "13. Migration"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#131-classification-and-inventory (lines 426–426) is carried at docs/platform/proposals/knowledge-registry-redesign.md#131-classification-and-inventory (lines 450–450); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 13.1 Classification And Inventory

The classification pass is read-only and can run in parallel. It reads the existing corpus and proposes:

```yaml
oldPath: docs/explanation/why-a-stale-worktree-index-produced-a-wrong-iron-law-test-count.md
topicId: stale-index-vs-uncommitted-work
purposeSlug: stale-index-vs-uncommitted-work
role: pitfall
entities: [worktree-index, iron-law, test-count]
framework: diataxis
mode: explanation
targetPath: docs/stale-index-vs-uncommitted-work/pitfall.md
```

This pass is also the bottom-up vocabulary discovery pass. It does not come after bootstrap; it is bootstrap's input.
````

### Full target shown text

````text
### 13.1 Classification And Inventory

The classification pass is read-only and can run in parallel. It reads the existing corpus and proposes:

```yaml
oldPath: docs/explanation/why-a-stale-worktree-index-produced-a-wrong-iron-law-test-count.md
topicId: stale-index-vs-uncommitted-work
purposeSlug: stale-index-vs-uncommitted-work
role: pitfall
entities: [worktree-index, iron-law, test-count]
framework: diataxis
mode: explanation
targetPath: docs/stale-index-vs-uncommitted-work/pitfall.md
```

This pass is also the bottom-up vocabulary discovery pass. It does not come after bootstrap; it is bootstrap's input.
````

## claim_aa0d8d485b5da7af42e02d8095ea78a8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-96, lines 428–428.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-99.
Source digest: 69ee2612843262da90113b815c69b02b349f41b6f4f81ab94f5dbc002360b104
Target digest: 69ee2612843262da90113b815c69b02b349f41b6f4f81ab94f5dbc002360b104
Shown source SHA256: 69ee2612843262da90113b815c69b02b349f41b6f4f81ab94f5dbc002360b104
Shown target SHA256: 69ee2612843262da90113b815c69b02b349f41b6f4f81ab94f5dbc002360b104

### Proposed decision

```json
{
  "claimId": "claim_aa0d8d485b5da7af42e02d8095ea78a8",
  "sourceUnitDigest": "69ee2612843262da90113b815c69b02b349f41b6f4f81ab94f5dbc002360b104",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-99",
  "targetUnitDigest": "69ee2612843262da90113b815c69b02b349f41b6f4f81ab94f5dbc002360b104",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "13. Migration",
    "13.1 Classification And Inventory"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-96 (lines 428–428) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-99 (lines 452–452); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The classification pass is read-only and can run in parallel. It reads the existing corpus and proposes:
```

### Full target shown text

```text
The classification pass is read-only and can run in parallel. It reads the existing corpus and proposes:
```

## claim_27250f167b0e97a7d9333fd9e71d91fb

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-97, lines 430–439.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-100.
Source digest: f60a2323974b490e3f0442f35636ed78a099d5842d24f083b83d7fe071434851
Target digest: f60a2323974b490e3f0442f35636ed78a099d5842d24f083b83d7fe071434851
Shown source SHA256: f60a2323974b490e3f0442f35636ed78a099d5842d24f083b83d7fe071434851
Shown target SHA256: f60a2323974b490e3f0442f35636ed78a099d5842d24f083b83d7fe071434851

### Proposed decision

```json
{
  "claimId": "claim_27250f167b0e97a7d9333fd9e71d91fb",
  "sourceUnitDigest": "f60a2323974b490e3f0442f35636ed78a099d5842d24f083b83d7fe071434851",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-100",
  "targetUnitDigest": "f60a2323974b490e3f0442f35636ed78a099d5842d24f083b83d7fe071434851",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "13. Migration",
    "13.1 Classification And Inventory"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-97 (lines 430–439) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-100 (lines 454–463); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```yaml
oldPath: docs/explanation/why-a-stale-worktree-index-produced-a-wrong-iron-law-test-count.md
topicId: stale-index-vs-uncommitted-work
purposeSlug: stale-index-vs-uncommitted-work
role: pitfall
entities: [worktree-index, iron-law, test-count]
framework: diataxis
mode: explanation
targetPath: docs/stale-index-vs-uncommitted-work/pitfall.md
```
````

### Full target shown text

````text
```yaml
oldPath: docs/explanation/why-a-stale-worktree-index-produced-a-wrong-iron-law-test-count.md
topicId: stale-index-vs-uncommitted-work
purposeSlug: stale-index-vs-uncommitted-work
role: pitfall
entities: [worktree-index, iron-law, test-count]
framework: diataxis
mode: explanation
targetPath: docs/stale-index-vs-uncommitted-work/pitfall.md
```
````

## claim_cbd310360acef5bec3c0549d122a38a3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-98, lines 441–441.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-101.
Source digest: 9a04edaff1ed99d18a39e25f9c7b2cb8c6c99cf3f28f5f93316a5e0f394f5a59
Target digest: 9a04edaff1ed99d18a39e25f9c7b2cb8c6c99cf3f28f5f93316a5e0f394f5a59
Shown source SHA256: 9a04edaff1ed99d18a39e25f9c7b2cb8c6c99cf3f28f5f93316a5e0f394f5a59
Shown target SHA256: 9a04edaff1ed99d18a39e25f9c7b2cb8c6c99cf3f28f5f93316a5e0f394f5a59

### Proposed decision

```json
{
  "claimId": "claim_cbd310360acef5bec3c0549d122a38a3",
  "sourceUnitDigest": "9a04edaff1ed99d18a39e25f9c7b2cb8c6c99cf3f28f5f93316a5e0f394f5a59",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-101",
  "targetUnitDigest": "9a04edaff1ed99d18a39e25f9c7b2cb8c6c99cf3f28f5f93316a5e0f394f5a59",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "13. Migration",
    "13.1 Classification And Inventory"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-98 (lines 441–441) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-101 (lines 465–465); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
This pass is also the bottom-up vocabulary discovery pass. It does not come after bootstrap; it is bootstrap's input.
```

### Full target shown text

```text
This pass is also the bottom-up vocabulary discovery pass. It does not come after bootstrap; it is bootstrap's input.
```

## claim_b442f52140727026f5ec5f9cfc16b5f6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#132-bootstrap-without-moving, lines 443–443.
Target: docs/platform/proposals/knowledge-registry-redesign.md#132-bootstrap-without-moving.
Source digest: 0016ce253d4491cb82e0a723907359ac2127e0c8864f25b9fd788033e99ed4bc
Target digest: 0016ce253d4491cb82e0a723907359ac2127e0c8864f25b9fd788033e99ed4bc
Shown source SHA256: 7d52b386ce105be8e0aaff4e0ba7e5c1de4d1bf404f8b5e90e8982f2fbc412ba
Shown target SHA256: 7d52b386ce105be8e0aaff4e0ba7e5c1de4d1bf404f8b5e90e8982f2fbc412ba

### Proposed decision

```json
{
  "claimId": "claim_b442f52140727026f5ec5f9cfc16b5f6",
  "sourceUnitDigest": "0016ce253d4491cb82e0a723907359ac2127e0c8864f25b9fd788033e99ed4bc",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "132-bootstrap-without-moving",
  "targetUnitDigest": "0016ce253d4491cb82e0a723907359ac2127e0c8864f25b9fd788033e99ed4bc",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "13. Migration"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#132-bootstrap-without-moving (lines 443–443) is carried at docs/platform/proposals/knowledge-registry-redesign.md#132-bootstrap-without-moving (lines 467–467); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 13.2 Bootstrap Without Moving

Bootstrap creates registry rows for the current corpus while preserving current paths. This lets enforcement begin before layout migration:

```yaml
currentPath: docs/explanation/why-a-stale-worktree-index-produced-a-wrong-iron-law-test-count.md
targetPath: docs/stale-index-vs-uncommitted-work/pitfall.md
```

The current path remains the old path until the migration move event runs.
````

### Full target shown text

````text
### 13.2 Bootstrap Without Moving

Bootstrap creates registry rows for the current corpus while preserving current paths. This lets enforcement begin before layout migration:

```yaml
currentPath: docs/explanation/why-a-stale-worktree-index-produced-a-wrong-iron-law-test-count.md
targetPath: docs/stale-index-vs-uncommitted-work/pitfall.md
```

The current path remains the old path until the migration move event runs.
````

## claim_3ec8890ad8ccd66ad5036d9a9906825b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-99, lines 445–445.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-102.
Source digest: 6c843da04e484d69b0cbcc975eb06071aaee12c8c8f29e2de98bab90ba3b89ab
Target digest: 6c843da04e484d69b0cbcc975eb06071aaee12c8c8f29e2de98bab90ba3b89ab
Shown source SHA256: 6c843da04e484d69b0cbcc975eb06071aaee12c8c8f29e2de98bab90ba3b89ab
Shown target SHA256: 6c843da04e484d69b0cbcc975eb06071aaee12c8c8f29e2de98bab90ba3b89ab

### Proposed decision

```json
{
  "claimId": "claim_3ec8890ad8ccd66ad5036d9a9906825b",
  "sourceUnitDigest": "6c843da04e484d69b0cbcc975eb06071aaee12c8c8f29e2de98bab90ba3b89ab",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-102",
  "targetUnitDigest": "6c843da04e484d69b0cbcc975eb06071aaee12c8c8f29e2de98bab90ba3b89ab",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "13. Migration",
    "13.2 Bootstrap Without Moving"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-99 (lines 445–445) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-102 (lines 469–469); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Bootstrap creates registry rows for the current corpus while preserving current paths. This lets enforcement begin before layout migration:
```

### Full target shown text

```text
Bootstrap creates registry rows for the current corpus while preserving current paths. This lets enforcement begin before layout migration:
```

## claim_2facf205bbdeb17772c1a44dbcb845d6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-100, lines 447–450.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-103.
Source digest: e961ef46f85203dd56e24d464b5ee851d6e80fe7388d6598629f8a59a3de5014
Target digest: e961ef46f85203dd56e24d464b5ee851d6e80fe7388d6598629f8a59a3de5014
Shown source SHA256: e961ef46f85203dd56e24d464b5ee851d6e80fe7388d6598629f8a59a3de5014
Shown target SHA256: e961ef46f85203dd56e24d464b5ee851d6e80fe7388d6598629f8a59a3de5014

### Proposed decision

```json
{
  "claimId": "claim_2facf205bbdeb17772c1a44dbcb845d6",
  "sourceUnitDigest": "e961ef46f85203dd56e24d464b5ee851d6e80fe7388d6598629f8a59a3de5014",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-103",
  "targetUnitDigest": "e961ef46f85203dd56e24d464b5ee851d6e80fe7388d6598629f8a59a3de5014",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "13. Migration",
    "13.2 Bootstrap Without Moving"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-100 (lines 447–450) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-103 (lines 471–474); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```yaml
currentPath: docs/explanation/why-a-stale-worktree-index-produced-a-wrong-iron-law-test-count.md
targetPath: docs/stale-index-vs-uncommitted-work/pitfall.md
```
````

### Full target shown text

````text
```yaml
currentPath: docs/explanation/why-a-stale-worktree-index-produced-a-wrong-iron-law-test-count.md
targetPath: docs/stale-index-vs-uncommitted-work/pitfall.md
```
````

## claim_de52f554965e8daef26b6a765a004d11

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-101, lines 452–452.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-104.
Source digest: 9654faf9973fa89efa1b4b9349e601898f3bb28a7cca930e862b82b89a04f389
Target digest: 9654faf9973fa89efa1b4b9349e601898f3bb28a7cca930e862b82b89a04f389
Shown source SHA256: 9654faf9973fa89efa1b4b9349e601898f3bb28a7cca930e862b82b89a04f389
Shown target SHA256: 9654faf9973fa89efa1b4b9349e601898f3bb28a7cca930e862b82b89a04f389

### Proposed decision

```json
{
  "claimId": "claim_de52f554965e8daef26b6a765a004d11",
  "sourceUnitDigest": "9654faf9973fa89efa1b4b9349e601898f3bb28a7cca930e862b82b89a04f389",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-104",
  "targetUnitDigest": "9654faf9973fa89efa1b4b9349e601898f3bb28a7cca930e862b82b89a04f389",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "13. Migration",
    "13.2 Bootstrap Without Moving"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-101 (lines 452–452) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-104 (lines 476–476); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The current path remains the old path until the migration move event runs.
```

### Full target shown text

```text
The current path remains the old path until the migration move event runs.
```

## claim_4d6f17ec90e299161646045320418699

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#133-dry-run, lines 454–454.
Target: docs/platform/proposals/knowledge-registry-redesign.md#133-dry-run.
Source digest: 2e90b039132ba9112f1d0963d9d153d0def0b13f5e4d6d51716e0dfab6e40367
Target digest: 2e90b039132ba9112f1d0963d9d153d0def0b13f5e4d6d51716e0dfab6e40367
Shown source SHA256: 8e82fde604e25ab674da61b2d6f3a7741f85671ff5e8a222616b3749cf437e86
Shown target SHA256: 8e82fde604e25ab674da61b2d6f3a7741f85671ff5e8a222616b3749cf437e86

### Proposed decision

```json
{
  "claimId": "claim_4d6f17ec90e299161646045320418699",
  "sourceUnitDigest": "2e90b039132ba9112f1d0963d9d153d0def0b13f5e4d6d51716e0dfab6e40367",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "133-dry-run",
  "targetUnitDigest": "2e90b039132ba9112f1d0963d9d153d0def0b13f5e4d6d51716e0dfab6e40367",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "13. Migration"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#133-dry-run (lines 454–454) is carried at docs/platform/proposals/knowledge-registry-redesign.md#133-dry-run (lines 478–478); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 13.3 Dry Run

Dry-run migration groups old files by target document. It reports:

- every source file;
- proposed target topic and role;
- target path;
- source capture ids reachable before migration;
- aliases to be created;
- source files excluded with explicit reason;
- near-duplicate warnings;
- oversized target warnings.

Dry run writes a report, not the documentation tree.
```

### Full target shown text

```text
### 13.3 Dry Run

Dry-run migration groups old files by target document. It reports:

- every source file;
- proposed target topic and role;
- target path;
- source capture ids reachable before migration;
- aliases to be created;
- source files excluded with explicit reason;
- near-duplicate warnings;
- oversized target warnings.

Dry run writes a report, not the documentation tree.
```

## claim_5f86b31154af47ad05e9c26b6196b4fc

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-102, lines 456–456.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-105.
Source digest: ce21b938a2422b69a91ebef91006268a2a57fe2b42f3dfea448dc13421a2d39a
Target digest: ce21b938a2422b69a91ebef91006268a2a57fe2b42f3dfea448dc13421a2d39a
Shown source SHA256: ce21b938a2422b69a91ebef91006268a2a57fe2b42f3dfea448dc13421a2d39a
Shown target SHA256: ce21b938a2422b69a91ebef91006268a2a57fe2b42f3dfea448dc13421a2d39a

### Proposed decision

```json
{
  "claimId": "claim_5f86b31154af47ad05e9c26b6196b4fc",
  "sourceUnitDigest": "ce21b938a2422b69a91ebef91006268a2a57fe2b42f3dfea448dc13421a2d39a",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-105",
  "targetUnitDigest": "ce21b938a2422b69a91ebef91006268a2a57fe2b42f3dfea448dc13421a2d39a",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "13. Migration",
    "13.3 Dry Run"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-102 (lines 456–456) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-105 (lines 480–480); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Dry-run migration groups old files by target document. It reports:
```

### Full target shown text

```text
Dry-run migration groups old files by target document. It reports:
```

## claim_9fb7e5fbca88c363d6d2498c6462b332

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-103, lines 458–465.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-106.
Source digest: 27a9ff2dd3fee174705c427f7b723c21d7bdc48cafdc2c6a703c19e5a580c4a5
Target digest: 27a9ff2dd3fee174705c427f7b723c21d7bdc48cafdc2c6a703c19e5a580c4a5
Shown source SHA256: 27a9ff2dd3fee174705c427f7b723c21d7bdc48cafdc2c6a703c19e5a580c4a5
Shown target SHA256: 27a9ff2dd3fee174705c427f7b723c21d7bdc48cafdc2c6a703c19e5a580c4a5

### Proposed decision

```json
{
  "claimId": "claim_9fb7e5fbca88c363d6d2498c6462b332",
  "sourceUnitDigest": "27a9ff2dd3fee174705c427f7b723c21d7bdc48cafdc2c6a703c19e5a580c4a5",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-106",
  "targetUnitDigest": "27a9ff2dd3fee174705c427f7b723c21d7bdc48cafdc2c6a703c19e5a580c4a5",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "13. Migration",
    "13.3 Dry Run"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-103 (lines 458–465) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-106 (lines 482–489); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- every source file;
- proposed target topic and role;
- target path;
- source capture ids reachable before migration;
- aliases to be created;
- source files excluded with explicit reason;
- near-duplicate warnings;
- oversized target warnings.
```

### Full target shown text

```text
- every source file;
- proposed target topic and role;
- target path;
- source capture ids reachable before migration;
- aliases to be created;
- source files excluded with explicit reason;
- near-duplicate warnings;
- oversized target warnings.
```

## claim_1304612e2df9bdcf09ac85242d8703cd

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-104, lines 467–467.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-107.
Source digest: 677e8a204874fe2c756bc3f804469c780ae018396dc01576d27a178b2baa0f88
Target digest: 677e8a204874fe2c756bc3f804469c780ae018396dc01576d27a178b2baa0f88
Shown source SHA256: 677e8a204874fe2c756bc3f804469c780ae018396dc01576d27a178b2baa0f88
Shown target SHA256: 677e8a204874fe2c756bc3f804469c780ae018396dc01576d27a178b2baa0f88

### Proposed decision

```json
{
  "claimId": "claim_1304612e2df9bdcf09ac85242d8703cd",
  "sourceUnitDigest": "677e8a204874fe2c756bc3f804469c780ae018396dc01576d27a178b2baa0f88",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-107",
  "targetUnitDigest": "677e8a204874fe2c756bc3f804469c780ae018396dc01576d27a178b2baa0f88",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "13. Migration",
    "13.3 Dry Run"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-104 (lines 467–467) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-107 (lines 491–491); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Dry run writes a report, not the documentation tree.
```

### Full target shown text

```text
Dry run writes a report, not the documentation tree.
```

## claim_9341799967f81fa7b3730c3c7db1cdc1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#134-conservation, lines 469–469.
Target: docs/platform/proposals/knowledge-registry-redesign.md#134-conservation.
Source digest: ac7e77aa49da249f317d324ce6d24d7a5444862966406dc8b7a997825d7d7941
Target digest: ac7e77aa49da249f317d324ce6d24d7a5444862966406dc8b7a997825d7d7941
Shown source SHA256: 8a9f87f05085fec6b51a359aaa0e55a0c753050f1a844ed8d0a4a0d773227a06
Shown target SHA256: 8a9f87f05085fec6b51a359aaa0e55a0c753050f1a844ed8d0a4a0d773227a06

### Proposed decision

```json
{
  "claimId": "claim_9341799967f81fa7b3730c3c7db1cdc1",
  "sourceUnitDigest": "ac7e77aa49da249f317d324ce6d24d7a5444862966406dc8b7a997825d7d7941",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "134-conservation",
  "targetUnitDigest": "ac7e77aa49da249f317d324ce6d24d7a5444862966406dc8b7a997825d7d7941",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "13. Migration"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#134-conservation (lines 469–469) is carried at docs/platform/proposals/knowledge-registry-redesign.md#134-conservation (lines 493–493); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 13.4 Conservation

Every old file must appear exactly once:

- as a source of one target document; or
- in an excluded list with a reason.

Missing files, duplicate source assignments, and target documents with no source all fail.
```

### Full target shown text

```text
### 13.4 Conservation

Every old file must appear exactly once:

- as a source of one target document; or
- in an excluded list with a reason.

Missing files, duplicate source assignments, and target documents with no source all fail.
```

## claim_8447852afa99dd20cecb5987e24a95a0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-105, lines 471–471.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-108.
Source digest: 77b959ba2608c03f83fe5e2eae7884d7a389a782b69cc5e7f0cfca4c2d1238ee
Target digest: 77b959ba2608c03f83fe5e2eae7884d7a389a782b69cc5e7f0cfca4c2d1238ee
Shown source SHA256: 77b959ba2608c03f83fe5e2eae7884d7a389a782b69cc5e7f0cfca4c2d1238ee
Shown target SHA256: 77b959ba2608c03f83fe5e2eae7884d7a389a782b69cc5e7f0cfca4c2d1238ee

### Proposed decision

```json
{
  "claimId": "claim_8447852afa99dd20cecb5987e24a95a0",
  "sourceUnitDigest": "77b959ba2608c03f83fe5e2eae7884d7a389a782b69cc5e7f0cfca4c2d1238ee",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-108",
  "targetUnitDigest": "77b959ba2608c03f83fe5e2eae7884d7a389a782b69cc5e7f0cfca4c2d1238ee",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "13. Migration",
    "13.4 Conservation"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-105 (lines 471–471) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-108 (lines 495–495); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Every old file must appear exactly once:
```

### Full target shown text

```text
Every old file must appear exactly once:
```

## claim_d6a46272a246f08e4dfedbd5279371d9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-106, lines 473–474.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-109.
Source digest: 03f6fb773b134785004b21e1528c3ccad03b100c4de6effcd765acc88e276b57
Target digest: 03f6fb773b134785004b21e1528c3ccad03b100c4de6effcd765acc88e276b57
Shown source SHA256: 03f6fb773b134785004b21e1528c3ccad03b100c4de6effcd765acc88e276b57
Shown target SHA256: 03f6fb773b134785004b21e1528c3ccad03b100c4de6effcd765acc88e276b57

### Proposed decision

```json
{
  "claimId": "claim_d6a46272a246f08e4dfedbd5279371d9",
  "sourceUnitDigest": "03f6fb773b134785004b21e1528c3ccad03b100c4de6effcd765acc88e276b57",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-109",
  "targetUnitDigest": "03f6fb773b134785004b21e1528c3ccad03b100c4de6effcd765acc88e276b57",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "13. Migration",
    "13.4 Conservation"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-106 (lines 473–474) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-109 (lines 497–498); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- as a source of one target document; or
- in an excluded list with a reason.
```

### Full target shown text

```text
- as a source of one target document; or
- in an excluded list with a reason.
```

## claim_74d7f61e8ea3df4f488e21dbb296a213

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-107, lines 476–476.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-110.
Source digest: 0e615407745f1a55019976b674da00c5fb8b0cc7d83e8aa653b8a55b0acb69e7
Target digest: 0e615407745f1a55019976b674da00c5fb8b0cc7d83e8aa653b8a55b0acb69e7
Shown source SHA256: 0e615407745f1a55019976b674da00c5fb8b0cc7d83e8aa653b8a55b0acb69e7
Shown target SHA256: 0e615407745f1a55019976b674da00c5fb8b0cc7d83e8aa653b8a55b0acb69e7

### Proposed decision

```json
{
  "claimId": "claim_74d7f61e8ea3df4f488e21dbb296a213",
  "sourceUnitDigest": "0e615407745f1a55019976b674da00c5fb8b0cc7d83e8aa653b8a55b0acb69e7",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-110",
  "targetUnitDigest": "0e615407745f1a55019976b674da00c5fb8b0cc7d83e8aa653b8a55b0acb69e7",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "13. Migration",
    "13.4 Conservation"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-107 (lines 476–476) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-110 (lines 500–500); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Missing files, duplicate source assignments, and target documents with no source all fail.
```

### Full target shown text

```text
Missing files, duplicate source assignments, and target documents with no source all fail.
```

## claim_d8c8723094145e1c69a45bf57e445b86

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#135-apply, lines 478–478.
Target: docs/platform/proposals/knowledge-registry-redesign.md#135-apply.
Source digest: 8db4034852b1ebbf320991b529739b3a9aea4aca2e32704ecdff3b3e1c11074d
Target digest: 8db4034852b1ebbf320991b529739b3a9aea4aca2e32704ecdff3b3e1c11074d
Shown source SHA256: 51a2529a96b069545f0a641f0e616ce1a28dcedeb948c12a9544e8e77468862b
Shown target SHA256: 51a2529a96b069545f0a641f0e616ce1a28dcedeb948c12a9544e8e77468862b

### Proposed decision

```json
{
  "claimId": "claim_d8c8723094145e1c69a45bf57e445b86",
  "sourceUnitDigest": "8db4034852b1ebbf320991b529739b3a9aea4aca2e32704ecdff3b3e1c11074d",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "135-apply",
  "targetUnitDigest": "8db4034852b1ebbf320991b529739b3a9aea4aca2e32704ecdff3b3e1c11074d",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "13. Migration"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#135-apply (lines 478–478) is carried at docs/platform/proposals/knowledge-registry-redesign.md#135-apply (lines 502–502); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 13.5 Apply

Apply runs after enforcement and read surfaces are registry-aware.

It:

1. records path move events;
2. moves or folds files by target document;
3. creates aliases for every old path;
4. rebuilds machine and human projections;
5. verifies source reachability before and after;
6. leaves every migrated document provisional unless explicitly promoted.

Parallelism is allowed by target document, not by arbitrary source file. Multiple workers must not write the same target document concurrently.
```

### Full target shown text

```text
### 13.5 Apply

Apply runs after enforcement and read surfaces are registry-aware.

It:

1. records path move events;
2. moves or folds files by target document;
3. creates aliases for every old path;
4. rebuilds machine and human projections;
5. verifies source reachability before and after;
6. leaves every migrated document provisional unless explicitly promoted.

Parallelism is allowed by target document, not by arbitrary source file. Multiple workers must not write the same target document concurrently.
```

## claim_5629bfdcc211bc34198b9f37b70b53c8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-108, lines 480–480.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-111.
Source digest: eccd52b5ebaf56a67a69e541d13d002917b71d4486aa7a5ab824514f7831ab9f
Target digest: eccd52b5ebaf56a67a69e541d13d002917b71d4486aa7a5ab824514f7831ab9f
Shown source SHA256: eccd52b5ebaf56a67a69e541d13d002917b71d4486aa7a5ab824514f7831ab9f
Shown target SHA256: eccd52b5ebaf56a67a69e541d13d002917b71d4486aa7a5ab824514f7831ab9f

### Proposed decision

```json
{
  "claimId": "claim_5629bfdcc211bc34198b9f37b70b53c8",
  "sourceUnitDigest": "eccd52b5ebaf56a67a69e541d13d002917b71d4486aa7a5ab824514f7831ab9f",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-111",
  "targetUnitDigest": "eccd52b5ebaf56a67a69e541d13d002917b71d4486aa7a5ab824514f7831ab9f",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "13. Migration",
    "13.5 Apply"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-108 (lines 480–480) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-111 (lines 504–504); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Apply runs after enforcement and read surfaces are registry-aware.
```

### Full target shown text

```text
Apply runs after enforcement and read surfaces are registry-aware.
```

## claim_ccd5d15ead785b15b20ea761e988ba88

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-109, lines 482–489.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-112.
Source digest: c654446c29273640daaee1c4d8ac7d659ae45a868135bd7f3e91af07c6cd4b10
Target digest: c654446c29273640daaee1c4d8ac7d659ae45a868135bd7f3e91af07c6cd4b10
Shown source SHA256: c654446c29273640daaee1c4d8ac7d659ae45a868135bd7f3e91af07c6cd4b10
Shown target SHA256: c654446c29273640daaee1c4d8ac7d659ae45a868135bd7f3e91af07c6cd4b10

### Proposed decision

```json
{
  "claimId": "claim_ccd5d15ead785b15b20ea761e988ba88",
  "sourceUnitDigest": "c654446c29273640daaee1c4d8ac7d659ae45a868135bd7f3e91af07c6cd4b10",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-112",
  "targetUnitDigest": "c654446c29273640daaee1c4d8ac7d659ae45a868135bd7f3e91af07c6cd4b10",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "13. Migration",
    "13.5 Apply"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-109 (lines 482–489) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-112 (lines 506–513); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
It:

1. records path move events;
2. moves or folds files by target document;
3. creates aliases for every old path;
4. rebuilds machine and human projections;
5. verifies source reachability before and after;
6. leaves every migrated document provisional unless explicitly promoted.
```

### Full target shown text

```text
It:

1. records path move events;
2. moves or folds files by target document;
3. creates aliases for every old path;
4. rebuilds machine and human projections;
5. verifies source reachability before and after;
6. leaves every migrated document provisional unless explicitly promoted.
```

## claim_aa415a893b85a9816709da7651a3923c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-110, lines 491–491.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-113.
Source digest: a18d67904c5ac0d260cd63ebf8a6704131650f3f3a7da82ba920c0a59b445d14
Target digest: a18d67904c5ac0d260cd63ebf8a6704131650f3f3a7da82ba920c0a59b445d14
Shown source SHA256: a18d67904c5ac0d260cd63ebf8a6704131650f3f3a7da82ba920c0a59b445d14
Shown target SHA256: a18d67904c5ac0d260cd63ebf8a6704131650f3f3a7da82ba920c0a59b445d14

### Proposed decision

```json
{
  "claimId": "claim_aa415a893b85a9816709da7651a3923c",
  "sourceUnitDigest": "a18d67904c5ac0d260cd63ebf8a6704131650f3f3a7da82ba920c0a59b445d14",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-113",
  "targetUnitDigest": "a18d67904c5ac0d260cd63ebf8a6704131650f3f3a7da82ba920c0a59b445d14",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "13. Migration",
    "13.5 Apply"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-110 (lines 491–491) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-113 (lines 515–515); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Parallelism is allowed by target document, not by arbitrary source file. Multiple workers must not write the same target document concurrently.
```

### Full target shown text

```text
Parallelism is allowed by target document, not by arbitrary source file. Multiple workers must not write the same target document concurrently.
```

## claim_7e5c816a49e65adfe1e71e712f5f313e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#14-harness-layer, lines 493–493.
Target: docs/platform/proposals/knowledge-registry-redesign.md#14-harness-layer.
Source digest: 04a8685e9ccbedb181dc087be6d92b691aeb09c188ec6641a67a839a3943a574
Target digest: 04a8685e9ccbedb181dc087be6d92b691aeb09c188ec6641a67a839a3943a574
Shown source SHA256: a14cd5d0ef69d716db209ff5f5f96abba5f9c346e934f2df5cd39365cf382e62
Shown target SHA256: a14cd5d0ef69d716db209ff5f5f96abba5f9c346e934f2df5cd39365cf382e62

### Proposed decision

```json
{
  "claimId": "claim_7e5c816a49e65adfe1e71e712f5f313e",
  "sourceUnitDigest": "04a8685e9ccbedb181dc087be6d92b691aeb09c188ec6641a67a839a3943a574",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "14-harness-layer",
  "targetUnitDigest": "04a8685e9ccbedb181dc087be6d92b691aeb09c188ec6641a67a839a3943a574",
  "targetAncestry": [
    "Knowledge Registry Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#14-harness-layer (lines 493–493) is carried at docs/platform/proposals/knowledge-registry-redesign.md#14-harness-layer (lines 517–517); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 14. Harness Layer

The harness is part of the design, not a follow-up nicety.
```

### Full target shown text

```text
## 14. Harness Layer

The harness is part of the design, not a follow-up nicety.
```

## claim_5253c7e3e86b0f2f9ed4c643cb12f039

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-111, lines 495–495.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-114.
Source digest: d105b260a61023e18fdf8bf13324960820dcbccf389acf5e79739b7a5f5db6d0
Target digest: d105b260a61023e18fdf8bf13324960820dcbccf389acf5e79739b7a5f5db6d0
Shown source SHA256: d105b260a61023e18fdf8bf13324960820dcbccf389acf5e79739b7a5f5db6d0
Shown target SHA256: d105b260a61023e18fdf8bf13324960820dcbccf389acf5e79739b7a5f5db6d0

### Proposed decision

```json
{
  "claimId": "claim_5253c7e3e86b0f2f9ed4c643cb12f039",
  "sourceUnitDigest": "d105b260a61023e18fdf8bf13324960820dcbccf389acf5e79739b7a5f5db6d0",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-114",
  "targetUnitDigest": "d105b260a61023e18fdf8bf13324960820dcbccf389acf5e79739b7a5f5db6d0",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "14. Harness Layer"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-111 (lines 495–495) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-114 (lines 519–519); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The harness is part of the design, not a follow-up nicety.
```

### Full target shown text

```text
The harness is part of the design, not a follow-up nicety.
```

## claim_3556244cddca60196c895328e4e9be76

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#141-unit-harness, lines 497–497.
Target: docs/platform/proposals/knowledge-registry-redesign.md#141-unit-harness.
Source digest: 17de3a7412a9b9cced76ac9fc6c4559d9a0c0e0cd1a7c55f5e1f6af87e83c2ae
Target digest: 17de3a7412a9b9cced76ac9fc6c4559d9a0c0e0cd1a7c55f5e1f6af87e83c2ae
Shown source SHA256: 5fda3a7c0656002e5edaf4d42cfe044cceb18ebb0e33285807943fa2235ee502
Shown target SHA256: 5fda3a7c0656002e5edaf4d42cfe044cceb18ebb0e33285807943fa2235ee502

### Proposed decision

```json
{
  "claimId": "claim_3556244cddca60196c895328e4e9be76",
  "sourceUnitDigest": "17de3a7412a9b9cced76ac9fc6c4559d9a0c0e0cd1a7c55f5e1f6af87e83c2ae",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "141-unit-harness",
  "targetUnitDigest": "17de3a7412a9b9cced76ac9fc6c4559d9a0c0e0cd1a7c55f5e1f6af87e83c2ae",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "14. Harness Layer"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#141-unit-harness (lines 497–497) is carried at docs/platform/proposals/knowledge-registry-redesign.md#141-unit-harness (lines 521–521); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 14.1 Unit Harness

Reducer and model tests:

- topic register creates an active topic with stable identity;
- topic rename changes labels without losing identity;
- topic split records successor lineage and retires or narrows the old topic;
- topic merge records predecessors and successor;
- doc reserve holds exactly one slot for `(topicId, role)`;
- active documents obey `activeDoc(topicId, role) <= 1`;
- aliases resolve to the same document but do not count as current paths;
- role names cannot collide with framework mode names;
- unknown role and unknown framework mode are rejected;
- projections are deterministic.
```

### Full target shown text

```text
### 14.1 Unit Harness

Reducer and model tests:

- topic register creates an active topic with stable identity;
- topic rename changes labels without losing identity;
- topic split records successor lineage and retires or narrows the old topic;
- topic merge records predecessors and successor;
- doc reserve holds exactly one slot for `(topicId, role)`;
- active documents obey `activeDoc(topicId, role) <= 1`;
- aliases resolve to the same document but do not count as current paths;
- role names cannot collide with framework mode names;
- unknown role and unknown framework mode are rejected;
- projections are deterministic.
```

## claim_4f66e7ebc78febfaa302c3636130351a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-112, lines 499–499.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-115.
Source digest: 6ad5f05ee8350b77bbaf6778188e60e26cbfaab535c2893c0b06452239a2295a
Target digest: 6ad5f05ee8350b77bbaf6778188e60e26cbfaab535c2893c0b06452239a2295a
Shown source SHA256: 6ad5f05ee8350b77bbaf6778188e60e26cbfaab535c2893c0b06452239a2295a
Shown target SHA256: 6ad5f05ee8350b77bbaf6778188e60e26cbfaab535c2893c0b06452239a2295a

### Proposed decision

```json
{
  "claimId": "claim_4f66e7ebc78febfaa302c3636130351a",
  "sourceUnitDigest": "6ad5f05ee8350b77bbaf6778188e60e26cbfaab535c2893c0b06452239a2295a",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-115",
  "targetUnitDigest": "6ad5f05ee8350b77bbaf6778188e60e26cbfaab535c2893c0b06452239a2295a",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "14. Harness Layer",
    "14.1 Unit Harness"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-112 (lines 499–499) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-115 (lines 523–523); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Reducer and model tests:
```

### Full target shown text

```text
Reducer and model tests:
```

## claim_30d56611105826e4c763847986173bd3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-113, lines 501–510.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-116.
Source digest: b930b7ebf7e846e9c95c2df7ff4c6b474cddbad2e532b6a70d56ad540ba9ad15
Target digest: b930b7ebf7e846e9c95c2df7ff4c6b474cddbad2e532b6a70d56ad540ba9ad15
Shown source SHA256: b930b7ebf7e846e9c95c2df7ff4c6b474cddbad2e532b6a70d56ad540ba9ad15
Shown target SHA256: b930b7ebf7e846e9c95c2df7ff4c6b474cddbad2e532b6a70d56ad540ba9ad15

### Proposed decision

```json
{
  "claimId": "claim_30d56611105826e4c763847986173bd3",
  "sourceUnitDigest": "b930b7ebf7e846e9c95c2df7ff4c6b474cddbad2e532b6a70d56ad540ba9ad15",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-116",
  "targetUnitDigest": "b930b7ebf7e846e9c95c2df7ff4c6b474cddbad2e532b6a70d56ad540ba9ad15",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "14. Harness Layer",
    "14.1 Unit Harness"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-113 (lines 501–510) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-116 (lines 525–534); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- topic register creates an active topic with stable identity;
- topic rename changes labels without losing identity;
- topic split records successor lineage and retires or narrows the old topic;
- topic merge records predecessors and successor;
- doc reserve holds exactly one slot for `(topicId, role)`;
- active documents obey `activeDoc(topicId, role) <= 1`;
- aliases resolve to the same document but do not count as current paths;
- role names cannot collide with framework mode names;
- unknown role and unknown framework mode are rejected;
- projections are deterministic.
```

### Full target shown text

```text
- topic register creates an active topic with stable identity;
- topic rename changes labels without losing identity;
- topic split records successor lineage and retires or narrows the old topic;
- topic merge records predecessors and successor;
- doc reserve holds exactly one slot for `(topicId, role)`;
- active documents obey `activeDoc(topicId, role) <= 1`;
- aliases resolve to the same document but do not count as current paths;
- role names cannot collide with framework mode names;
- unknown role and unknown framework mode are rejected;
- projections are deterministic.
```

## claim_74789f627810b3cd5613fdfa73bcd73f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#142-cli-harness, lines 512–512.
Target: docs/platform/proposals/knowledge-registry-redesign.md#142-cli-harness.
Source digest: d93993f705efd699448bdf296fd87ae485761a99fbc92427401f19faa907048e
Target digest: d93993f705efd699448bdf296fd87ae485761a99fbc92427401f19faa907048e
Shown source SHA256: 41f9deb0ed23c5e16df80ca7d9b17390645c59adf07055ba79af9c2e35fd0d2c
Shown target SHA256: 41f9deb0ed23c5e16df80ca7d9b17390645c59adf07055ba79af9c2e35fd0d2c

### Proposed decision

```json
{
  "claimId": "claim_74789f627810b3cd5613fdfa73bcd73f",
  "sourceUnitDigest": "d93993f705efd699448bdf296fd87ae485761a99fbc92427401f19faa907048e",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "142-cli-harness",
  "targetUnitDigest": "d93993f705efd699448bdf296fd87ae485761a99fbc92427401f19faa907048e",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "14. Harness Layer"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#142-cli-harness (lines 512–512) is carried at docs/platform/proposals/knowledge-registry-redesign.md#142-cli-harness (lines 536–536); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 14.2 CLI Harness

Command tests:

- `fgos topic register` records a topic event;
- `fgos topic split` records lineage and successors;
- `fgos topic merge` retires predecessors and points to successor;
- `fgos doc reserve` refuses a duplicate active/reserved slot;
- `fgos doc move-path` changes current path and preserves old path as alias;
- `fgos doc promote` accepts only `provisional -> active`;
- `fgos doc promote` refuses when another active doc already owns `(topicId, role)`;
- `fgos doc promote` refuses if the current path is absent from `HEAD`;
- no command creates an extra active document for the same topic and role without a split.
```

### Full target shown text

```text
### 14.2 CLI Harness

Command tests:

- `fgos topic register` records a topic event;
- `fgos topic split` records lineage and successors;
- `fgos topic merge` retires predecessors and points to successor;
- `fgos doc reserve` refuses a duplicate active/reserved slot;
- `fgos doc move-path` changes current path and preserves old path as alias;
- `fgos doc promote` accepts only `provisional -> active`;
- `fgos doc promote` refuses when another active doc already owns `(topicId, role)`;
- `fgos doc promote` refuses if the current path is absent from `HEAD`;
- no command creates an extra active document for the same topic and role without a split.
```

## claim_0151d90f29a74c5ce2276fd468370a54

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-114, lines 514–524.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-117.
Source digest: aac8873662375624bdde9a7ec2f1ab5424fafec81cf632380b17c1184bcb5105
Target digest: aac8873662375624bdde9a7ec2f1ab5424fafec81cf632380b17c1184bcb5105
Shown source SHA256: aac8873662375624bdde9a7ec2f1ab5424fafec81cf632380b17c1184bcb5105
Shown target SHA256: aac8873662375624bdde9a7ec2f1ab5424fafec81cf632380b17c1184bcb5105

### Proposed decision

```json
{
  "claimId": "claim_0151d90f29a74c5ce2276fd468370a54",
  "sourceUnitDigest": "aac8873662375624bdde9a7ec2f1ab5424fafec81cf632380b17c1184bcb5105",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-117",
  "targetUnitDigest": "aac8873662375624bdde9a7ec2f1ab5424fafec81cf632380b17c1184bcb5105",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "14. Harness Layer",
    "14.2 CLI Harness"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-114 (lines 514–524) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-117 (lines 538–548); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Command tests:

- `fgos topic register` records a topic event;
- `fgos topic split` records lineage and successors;
- `fgos topic merge` retires predecessors and points to successor;
- `fgos doc reserve` refuses a duplicate active/reserved slot;
- `fgos doc move-path` changes current path and preserves old path as alias;
- `fgos doc promote` accepts only `provisional -> active`;
- `fgos doc promote` refuses when another active doc already owns `(topicId, role)`;
- `fgos doc promote` refuses if the current path is absent from `HEAD`;
- no command creates an extra active document for the same topic and role without a split.
```

### Full target shown text

```text
Command tests:

- `fgos topic register` records a topic event;
- `fgos topic split` records lineage and successors;
- `fgos topic merge` retires predecessors and points to successor;
- `fgos doc reserve` refuses a duplicate active/reserved slot;
- `fgos doc move-path` changes current path and preserves old path as alias;
- `fgos doc promote` accepts only `provisional -> active`;
- `fgos doc promote` refuses when another active doc already owns `(topicId, role)`;
- `fgos doc promote` refuses if the current path is absent from `HEAD`;
- no command creates an extra active document for the same topic and role without a split.
```

## claim_1342d2837491a0f833d8bf52d2013d66

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#143-producer-gate-harness, lines 526–526.
Target: docs/platform/proposals/knowledge-registry-redesign.md#143-producer-gate-harness.
Source digest: 6316d5aebc3de69a965e89d2fb167b1b2322dbbc84e91ebc8cd0f3c2618c7e28
Target digest: 6316d5aebc3de69a965e89d2fb167b1b2322dbbc84e91ebc8cd0f3c2618c7e28
Shown source SHA256: c76981323cd50c19437e3a53ab91acefa69eb5a7e01c81fd253e91b82b680d56
Shown target SHA256: c76981323cd50c19437e3a53ab91acefa69eb5a7e01c81fd253e91b82b680d56

### Proposed decision

```json
{
  "claimId": "claim_1342d2837491a0f833d8bf52d2013d66",
  "sourceUnitDigest": "6316d5aebc3de69a965e89d2fb167b1b2322dbbc84e91ebc8cd0f3c2618c7e28",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "143-producer-gate-harness",
  "targetUnitDigest": "6316d5aebc3de69a965e89d2fb167b1b2322dbbc84e91ebc8cd0f3c2618c7e28",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "14. Harness Layer"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#143-producer-gate-harness (lines 526–526) is carried at docs/platform/proposals/knowledge-registry-redesign.md#143-producer-gate-harness (lines 550–550); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 14.3 Producer Gate Harness

Producer tests:

- attestation rejects a committed path not present in registry;
- attestation accepts a registered current path committed at `HEAD`;
- attestation rejects an alias path;
- attestation rejects a registered path that is not committed at `HEAD`;
- attestation rejects retired topics and retired documents;
- legacy compound compatibility uses the same gate;
- a legacy writer that self-names `docs/explanation/new-random.md` and commits it still fails attestation because the path is not a registry current path.
```

### Full target shown text

```text
### 14.3 Producer Gate Harness

Producer tests:

- attestation rejects a committed path not present in registry;
- attestation accepts a registered current path committed at `HEAD`;
- attestation rejects an alias path;
- attestation rejects a registered path that is not committed at `HEAD`;
- attestation rejects retired topics and retired documents;
- legacy compound compatibility uses the same gate;
- a legacy writer that self-names `docs/explanation/new-random.md` and commits it still fails attestation because the path is not a registry current path.
```

## claim_305f65f47bdaa1576c24d80175cfb4f8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-115, lines 528–536.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-118.
Source digest: b8b9e08c1bafe5d0746c6bae3c20a08c18a59f1a5febddc9f0cdcf07c0339864
Target digest: b8b9e08c1bafe5d0746c6bae3c20a08c18a59f1a5febddc9f0cdcf07c0339864
Shown source SHA256: b8b9e08c1bafe5d0746c6bae3c20a08c18a59f1a5febddc9f0cdcf07c0339864
Shown target SHA256: b8b9e08c1bafe5d0746c6bae3c20a08c18a59f1a5febddc9f0cdcf07c0339864

### Proposed decision

```json
{
  "claimId": "claim_305f65f47bdaa1576c24d80175cfb4f8",
  "sourceUnitDigest": "b8b9e08c1bafe5d0746c6bae3c20a08c18a59f1a5febddc9f0cdcf07c0339864",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-118",
  "targetUnitDigest": "b8b9e08c1bafe5d0746c6bae3c20a08c18a59f1a5febddc9f0cdcf07c0339864",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "14. Harness Layer",
    "14.3 Producer Gate Harness"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-115 (lines 528–536) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-118 (lines 552–560); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Producer tests:

- attestation rejects a committed path not present in registry;
- attestation accepts a registered current path committed at `HEAD`;
- attestation rejects an alias path;
- attestation rejects a registered path that is not committed at `HEAD`;
- attestation rejects retired topics and retired documents;
- legacy compound compatibility uses the same gate;
- a legacy writer that self-names `docs/explanation/new-random.md` and commits it still fails attestation because the path is not a registry current path.
```

### Full target shown text

```text
Producer tests:

- attestation rejects a committed path not present in registry;
- attestation accepts a registered current path committed at `HEAD`;
- attestation rejects an alias path;
- attestation rejects a registered path that is not committed at `HEAD`;
- attestation rejects retired topics and retired documents;
- legacy compound compatibility uses the same gate;
- a legacy writer that self-names `docs/explanation/new-random.md` and commits it still fails attestation because the path is not a registry current path.
```
