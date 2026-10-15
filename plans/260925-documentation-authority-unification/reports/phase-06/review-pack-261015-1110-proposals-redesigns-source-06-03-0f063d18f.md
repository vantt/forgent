# Bounded proposals and redesigns review pack

Content commit: 0f063d18fdab01cb6f2c915bb60ff528c5e0f238
Original shard: plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-06-knowledge-registry-redesign.json
Original shard SHA256: e24cf43c232be914afa51eac204db30de7609051b7c5ab1a22c4d1e8eae284cf
Source file: docs/architect/knowledge-registry-redesign.md
Part 3/3; entries: **37**. Source-file group 6/20.
Author session: codex-session:unit-run-1792034226117-40d90d09@2026-10-15
Row-level authoredBy is authoritative for mixed correction authors. Independent ordinary review only; all rows remain pending.

A36 differing-digest rows (2): `claim_c262ad8c4a5f18b68948f937e3361128`, `claim_0662afe5df2b25be15d682a21eb1117a`.

Absent-target rows (0): none.

Rows changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238 (2): `claim_c262ad8c4a5f18b68948f937e3361128`, `claim_0662afe5df2b25be15d682a21eb1117a`.

Weak-exact/Judgment population: 13; reviewer chooses and records seed and IDs for at least 10 deep reads (15%, minimum 10, all if fewer), plus every differing/absent pair. Mechanically verify all rows, full digests, anchors, ancestry, source eligibility, one owner and exact-proof thresholds. A36 supersedes the older 100% Weak-exact/Judgment deep-read rule in review-brief; retain its other ordinary-review obligations. If >3% deep rework, deep-read the whole pack. Mark each own note deep or mechanical. No author-selected draw or seed/key is supplied. Complete batch: 1,815 rows, 1,289 Unit-exact / 438 Weak-exact / 88 Judgment; 88 mandatory differing pairs; 114 correction rows.

Return an independent committed report with Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and this five-column table. Consolidate all parts for each original shard before unchanged ordinary application; these slices do not change shard bytes. Use ok/rework/hold with an own note and the full shown-unit digest (literal none for an absent target). Reverse eligibility and triage findings have separate requests and cannot approve these source rows.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

## Native gate blocker at the content pin

D reports eight decision-loss-without-partial-carry findings in the proposals README rationales (the phrase `it omits later siblings` describes the source index). The checker and decision content are unchanged. These are reported blockers, not waived findings. This pack contains 0 affected rows.

```json
[]
```

## claim_5e54746266e85323d836a84d083f728c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#144-resolver-harness, lines 538–538.
Target: docs/platform/proposals/knowledge-registry-redesign.md#144-resolver-harness.
Source digest: d78d3a47bb420bcaeaf6798d813597be4fdf4f3018ef717c1c5f7c253d6a94e9
Target digest: d78d3a47bb420bcaeaf6798d813597be4fdf4f3018ef717c1c5f7c253d6a94e9
Shown source SHA256: 3f0c4369955c1e64d4dc4ddb73a5f3f24a07d3e20e0056b64723b06c2213c6e7
Shown target SHA256: 3f0c4369955c1e64d4dc4ddb73a5f3f24a07d3e20e0056b64723b06c2213c6e7

### Proposed decision

```json
{
  "claimId": "claim_5e54746266e85323d836a84d083f728c",
  "sourceUnitDigest": "d78d3a47bb420bcaeaf6798d813597be4fdf4f3018ef717c1c5f7c253d6a94e9",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "144-resolver-harness",
  "targetUnitDigest": "d78d3a47bb420bcaeaf6798d813597be4fdf4f3018ef717c1c5f7c253d6a94e9",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "14. Harness Layer"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#144-resolver-harness (lines 538–538) is carried at docs/platform/proposals/knowledge-registry-redesign.md#144-resolver-harness (lines 562–562); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 14.4 Resolver Harness

Resolver tests:

- current path resolves to the document;
- alias path resolves to the document for reads;
- alias path is marked as alias hit;
- missing path returns null;
- document-source lookup by old path returns historical captures;
- document-source lookup by current path returns captures from current and alias paths;
- document index displays current path while preserving old path provenance.
```

### Full target shown text

```text
### 14.4 Resolver Harness

Resolver tests:

- current path resolves to the document;
- alias path resolves to the document for reads;
- alias path is marked as alias hit;
- missing path returns null;
- document-source lookup by old path returns historical captures;
- document-source lookup by current path returns captures from current and alias paths;
- document index displays current path while preserving old path provenance.
```

## claim_ce2d9edd895405a9aa0ad324b85b622f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-116, lines 540–548.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-119.
Source digest: b10548c2ba7d644971d478094fa336d4ab031afb19be038b06d33566204abc68
Target digest: b10548c2ba7d644971d478094fa336d4ab031afb19be038b06d33566204abc68
Shown source SHA256: b10548c2ba7d644971d478094fa336d4ab031afb19be038b06d33566204abc68
Shown target SHA256: b10548c2ba7d644971d478094fa336d4ab031afb19be038b06d33566204abc68

### Proposed decision

```json
{
  "claimId": "claim_ce2d9edd895405a9aa0ad324b85b622f",
  "sourceUnitDigest": "b10548c2ba7d644971d478094fa336d4ab031afb19be038b06d33566204abc68",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-119",
  "targetUnitDigest": "b10548c2ba7d644971d478094fa336d4ab031afb19be038b06d33566204abc68",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "14. Harness Layer",
    "14.4 Resolver Harness"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-116 (lines 540–548) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-119 (lines 564–572); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Resolver tests:

- current path resolves to the document;
- alias path resolves to the document for reads;
- alias path is marked as alias hit;
- missing path returns null;
- document-source lookup by old path returns historical captures;
- document-source lookup by current path returns captures from current and alias paths;
- document index displays current path while preserving old path provenance.
```

### Full target shown text

```text
Resolver tests:

- current path resolves to the document;
- alias path resolves to the document for reads;
- alias path is marked as alias hit;
- missing path returns null;
- document-source lookup by old path returns historical captures;
- document-source lookup by current path returns captures from current and alias paths;
- document index displays current path while preserving old path provenance.
```

## claim_c4efe6245b19e6bc565a5c5f5f1b269a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#145-migration-harness, lines 550–550.
Target: docs/platform/proposals/knowledge-registry-redesign.md#145-migration-harness.
Source digest: 853d6f6610d9eb73b43afc421d10ab2c7f66716e205dd57918a69487655af7f2
Target digest: 853d6f6610d9eb73b43afc421d10ab2c7f66716e205dd57918a69487655af7f2
Shown source SHA256: 1365a0a0be832c3aedbcb966324ca2025299c948f93f8d873e8d7b2831e70fd9
Shown target SHA256: 1365a0a0be832c3aedbcb966324ca2025299c948f93f8d873e8d7b2831e70fd9

### Proposed decision

```json
{
  "claimId": "claim_c4efe6245b19e6bc565a5c5f5f1b269a",
  "sourceUnitDigest": "853d6f6610d9eb73b43afc421d10ab2c7f66716e205dd57918a69487655af7f2",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "145-migration-harness",
  "targetUnitDigest": "853d6f6610d9eb73b43afc421d10ab2c7f66716e205dd57918a69487655af7f2",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "14. Harness Layer"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#145-migration-harness (lines 550–550) is carried at docs/platform/proposals/knowledge-registry-redesign.md#145-migration-harness (lines 574–574); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 14.5 Migration Harness

Migration tests:

- inventory includes every current end-user document once;
- conservation fails on missing source file;
- conservation fails on duplicate source assignment;
- conservation fails on target with no source;
- dry-run output is stable;
- apply does not reduce the number of reachable source captures;
- every old path becomes an alias or has an explicit exclusion;
- the three-worktree-docs regression reports a near duplicate even when one candidate proposes a different purpose.
```

### Full target shown text

```text
### 14.5 Migration Harness

Migration tests:

- inventory includes every current end-user document once;
- conservation fails on missing source file;
- conservation fails on duplicate source assignment;
- conservation fails on target with no source;
- dry-run output is stable;
- apply does not reduce the number of reachable source captures;
- every old path becomes an alias or has an explicit exclusion;
- the three-worktree-docs regression reports a near duplicate even when one candidate proposes a different purpose.
```

## claim_ba1b7a2eb36503858a6f00fbd24d978f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-117, lines 552–561.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-120.
Source digest: d30275e0e62d3f1d631c1049187b39321adf2d5ce751869ca70db2fca9fd78fb
Target digest: d30275e0e62d3f1d631c1049187b39321adf2d5ce751869ca70db2fca9fd78fb
Shown source SHA256: d30275e0e62d3f1d631c1049187b39321adf2d5ce751869ca70db2fca9fd78fb
Shown target SHA256: d30275e0e62d3f1d631c1049187b39321adf2d5ce751869ca70db2fca9fd78fb

### Proposed decision

```json
{
  "claimId": "claim_ba1b7a2eb36503858a6f00fbd24d978f",
  "sourceUnitDigest": "d30275e0e62d3f1d631c1049187b39321adf2d5ce751869ca70db2fca9fd78fb",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-120",
  "targetUnitDigest": "d30275e0e62d3f1d631c1049187b39321adf2d5ce751869ca70db2fca9fd78fb",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "14. Harness Layer",
    "14.5 Migration Harness"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-117 (lines 552–561) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-120 (lines 576–585); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Migration tests:

- inventory includes every current end-user document once;
- conservation fails on missing source file;
- conservation fails on duplicate source assignment;
- conservation fails on target with no source;
- dry-run output is stable;
- apply does not reduce the number of reachable source captures;
- every old path becomes an alias or has an explicit exclusion;
- the three-worktree-docs regression reports a near duplicate even when one candidate proposes a different purpose.
```

### Full target shown text

```text
Migration tests:

- inventory includes every current end-user document once;
- conservation fails on missing source file;
- conservation fails on duplicate source assignment;
- conservation fails on target with no source;
- dry-run output is stable;
- apply does not reduce the number of reachable source captures;
- every old path becomes an alias or has an explicit exclusion;
- the three-worktree-docs regression reports a near duplicate even when one candidate proposes a different purpose.
```

## claim_978990e36352feaf1bb434366d8c8afa

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#146-doctor-checks, lines 563–563.
Target: docs/platform/proposals/knowledge-registry-redesign.md#146-doctor-checks.
Source digest: d93d682237be07251de27f741d8446eea426253b7c1d4c62d6d9239e8da64cf8
Target digest: d93d682237be07251de27f741d8446eea426253b7c1d4c62d6d9239e8da64cf8
Shown source SHA256: f5e153689b722934eb3ce518136e1b5a893684d2cd3b16142d1a23c673407eb0
Shown target SHA256: f5e153689b722934eb3ce518136e1b5a893684d2cd3b16142d1a23c673407eb0

### Proposed decision

```json
{
  "claimId": "claim_978990e36352feaf1bb434366d8c8afa",
  "sourceUnitDigest": "d93d682237be07251de27f741d8446eea426253b7c1d4c62d6d9239e8da64cf8",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "146-doctor-checks",
  "targetUnitDigest": "d93d682237be07251de27f741d8446eea426253b7c1d4c62d6d9239e8da64cf8",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "14. Harness Layer"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#146-doctor-checks (lines 563–563) is carried at docs/platform/proposals/knowledge-registry-redesign.md#146-doctor-checks (lines 587–587); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 14.6 Doctor Checks

Doctor checks:

- `knowledge-registry-stale` - projections differ from registry events;
- `doc-active-duplicate` - more than one active document for `(topicId, role)`;
- `doc-alias-broken` - alias resolves to no live document;
- `doc-current-path-missing` - current path absent at `HEAD`;
- `doc-source-unreachable` - source capture linkage cannot be reached through current or alias paths;
- `doc-near-duplicate` - likely duplicate topic/doc across purpose boundaries;
- `doc-provisional-aged` - provisional document has aged past policy;
- `doc-topic-oversized` - topic exceeds split threshold;
- `doc-role-underused` - role has suspiciously low usage;
- `doc-source-conservation` - migration inventory or apply loses a source.
```

### Full target shown text

```text
### 14.6 Doctor Checks

Doctor checks:

- `knowledge-registry-stale` - projections differ from registry events;
- `doc-active-duplicate` - more than one active document for `(topicId, role)`;
- `doc-alias-broken` - alias resolves to no live document;
- `doc-current-path-missing` - current path absent at `HEAD`;
- `doc-source-unreachable` - source capture linkage cannot be reached through current or alias paths;
- `doc-near-duplicate` - likely duplicate topic/doc across purpose boundaries;
- `doc-provisional-aged` - provisional document has aged past policy;
- `doc-topic-oversized` - topic exceeds split threshold;
- `doc-role-underused` - role has suspiciously low usage;
- `doc-source-conservation` - migration inventory or apply loses a source.
```

## claim_84cfc524e894aa97a75987bf3e1b6d87

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-118, lines 565–576.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-121.
Source digest: beb878bd30697d5de17d4ca7d3f6baf2ace41eaf8f8396620194b2cb5a7335f5
Target digest: beb878bd30697d5de17d4ca7d3f6baf2ace41eaf8f8396620194b2cb5a7335f5
Shown source SHA256: beb878bd30697d5de17d4ca7d3f6baf2ace41eaf8f8396620194b2cb5a7335f5
Shown target SHA256: beb878bd30697d5de17d4ca7d3f6baf2ace41eaf8f8396620194b2cb5a7335f5

### Proposed decision

```json
{
  "claimId": "claim_84cfc524e894aa97a75987bf3e1b6d87",
  "sourceUnitDigest": "beb878bd30697d5de17d4ca7d3f6baf2ace41eaf8f8396620194b2cb5a7335f5",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-121",
  "targetUnitDigest": "beb878bd30697d5de17d4ca7d3f6baf2ace41eaf8f8396620194b2cb5a7335f5",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "14. Harness Layer",
    "14.6 Doctor Checks"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-118 (lines 565–576) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-121 (lines 589–600); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Doctor checks:

- `knowledge-registry-stale` - projections differ from registry events;
- `doc-active-duplicate` - more than one active document for `(topicId, role)`;
- `doc-alias-broken` - alias resolves to no live document;
- `doc-current-path-missing` - current path absent at `HEAD`;
- `doc-source-unreachable` - source capture linkage cannot be reached through current or alias paths;
- `doc-near-duplicate` - likely duplicate topic/doc across purpose boundaries;
- `doc-provisional-aged` - provisional document has aged past policy;
- `doc-topic-oversized` - topic exceeds split threshold;
- `doc-role-underused` - role has suspiciously low usage;
- `doc-source-conservation` - migration inventory or apply loses a source.
```

### Full target shown text

```text
Doctor checks:

- `knowledge-registry-stale` - projections differ from registry events;
- `doc-active-duplicate` - more than one active document for `(topicId, role)`;
- `doc-alias-broken` - alias resolves to no live document;
- `doc-current-path-missing` - current path absent at `HEAD`;
- `doc-source-unreachable` - source capture linkage cannot be reached through current or alias paths;
- `doc-near-duplicate` - likely duplicate topic/doc across purpose boundaries;
- `doc-provisional-aged` - provisional document has aged past policy;
- `doc-topic-oversized` - topic exceeds split threshold;
- `doc-role-underused` - role has suspiciously low usage;
- `doc-source-conservation` - migration inventory or apply loses a source.
```

## claim_32993754b0ab8f3f398ed5df8a2fe9a5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#147-metrics, lines 578–578.
Target: docs/platform/proposals/knowledge-registry-redesign.md#147-metrics.
Source digest: b87de1dd37f8aa9a4ac02dabc166b0fa4589a0adf4d24ed259dfe1d732c6f405
Target digest: b87de1dd37f8aa9a4ac02dabc166b0fa4589a0adf4d24ed259dfe1d732c6f405
Shown source SHA256: f09ebb026885df95ec60f63854baeca373c681bf2679e13da9473de7fc68afcb
Shown target SHA256: f09ebb026885df95ec60f63854baeca373c681bf2679e13da9473de7fc68afcb

### Proposed decision

```json
{
  "claimId": "claim_32993754b0ab8f3f398ed5df8a2fe9a5",
  "sourceUnitDigest": "b87de1dd37f8aa9a4ac02dabc166b0fa4589a0adf4d24ed259dfe1d732c6f405",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "147-metrics",
  "targetUnitDigest": "b87de1dd37f8aa9a4ac02dabc166b0fa4589a0adf4d24ed259dfe1d732c6f405",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "14. Harness Layer"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#147-metrics (lines 578–578) is carried at docs/platform/proposals/knowledge-registry-redesign.md#147-metrics (lines 602–602); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 14.7 Metrics

Track:

- new official topics per week;
- new active documents per week;
- new provisional documents per week;
- documents per active topic;
- average source captures per active document;
- alias count and old-path lookup success;
- near-duplicate warnings per week;
- provisional age distribution;
- role proposal count by proposed role;
- docs/day before and after migration.

The system is improving only if new active documents grow slower than work items and old-path source reachability remains intact.
```

### Full target shown text

```text
### 14.7 Metrics

Track:

- new official topics per week;
- new active documents per week;
- new provisional documents per week;
- documents per active topic;
- average source captures per active document;
- alias count and old-path lookup success;
- near-duplicate warnings per week;
- provisional age distribution;
- role proposal count by proposed role;
- docs/day before and after migration.

The system is improving only if new active documents grow slower than work items and old-path source reachability remains intact.
```

## claim_631031bf595995754713f71d818881e0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-119, lines 580–591.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-122.
Source digest: 5cee1d71431ac19991878fc2ced995f604da4e3e11adcafb00c07d90c34e7772
Target digest: 5cee1d71431ac19991878fc2ced995f604da4e3e11adcafb00c07d90c34e7772
Shown source SHA256: 5cee1d71431ac19991878fc2ced995f604da4e3e11adcafb00c07d90c34e7772
Shown target SHA256: 5cee1d71431ac19991878fc2ced995f604da4e3e11adcafb00c07d90c34e7772

### Proposed decision

```json
{
  "claimId": "claim_631031bf595995754713f71d818881e0",
  "sourceUnitDigest": "5cee1d71431ac19991878fc2ced995f604da4e3e11adcafb00c07d90c34e7772",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-122",
  "targetUnitDigest": "5cee1d71431ac19991878fc2ced995f604da4e3e11adcafb00c07d90c34e7772",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "14. Harness Layer",
    "14.7 Metrics"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-119 (lines 580–591) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-122 (lines 604–615); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Track:

- new official topics per week;
- new active documents per week;
- new provisional documents per week;
- documents per active topic;
- average source captures per active document;
- alias count and old-path lookup success;
- near-duplicate warnings per week;
- provisional age distribution;
- role proposal count by proposed role;
- docs/day before and after migration.
```

### Full target shown text

```text
Track:

- new official topics per week;
- new active documents per week;
- new provisional documents per week;
- documents per active topic;
- average source captures per active document;
- alias count and old-path lookup success;
- near-duplicate warnings per week;
- provisional age distribution;
- role proposal count by proposed role;
- docs/day before and after migration.
```

## claim_6fc102741beb79c577bd3c04c4e69976

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-120, lines 593–593.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-123.
Source digest: d419577d044205f0196174717288cf50b16d545dab73ac261f9135e61354f8ef
Target digest: d419577d044205f0196174717288cf50b16d545dab73ac261f9135e61354f8ef
Shown source SHA256: d419577d044205f0196174717288cf50b16d545dab73ac261f9135e61354f8ef
Shown target SHA256: d419577d044205f0196174717288cf50b16d545dab73ac261f9135e61354f8ef

### Proposed decision

```json
{
  "claimId": "claim_6fc102741beb79c577bd3c04c4e69976",
  "sourceUnitDigest": "d419577d044205f0196174717288cf50b16d545dab73ac261f9135e61354f8ef",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-123",
  "targetUnitDigest": "d419577d044205f0196174717288cf50b16d545dab73ac261f9135e61354f8ef",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "14. Harness Layer",
    "14.7 Metrics"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-120 (lines 593–593) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-123 (lines 617–617); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The system is improving only if new active documents grow slower than work items and old-path source reachability remains intact.
```

### Full target shown text

```text
The system is improving only if new active documents grow slower than work items and old-path source reachability remains intact.
```

## claim_288ee8dbb32cc7c6f92a21d39b3d30f3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#15-canary, lines 595–595.
Target: docs/platform/proposals/knowledge-registry-redesign.md#15-canary.
Source digest: 7233198da86b1b7c5978fe1ca420ab68b85405b2b6d2a9738a98db0865ea147b
Target digest: 7233198da86b1b7c5978fe1ca420ab68b85405b2b6d2a9738a98db0865ea147b
Shown source SHA256: 5e83a10af0d64611c1c31389e31e18d38296d87bc60c66b6ecddf1c81239d1a2
Shown target SHA256: 5e83a10af0d64611c1c31389e31e18d38296d87bc60c66b6ecddf1c81239d1a2

### Proposed decision

```json
{
  "claimId": "claim_288ee8dbb32cc7c6f92a21d39b3d30f3",
  "sourceUnitDigest": "7233198da86b1b7c5978fe1ca420ab68b85405b2b6d2a9738a98db0865ea147b",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "15-canary",
  "targetUnitDigest": "7233198da86b1b7c5978fe1ca420ab68b85405b2b6d2a9738a98db0865ea147b",
  "targetAncestry": [
    "Knowledge Registry Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#15-canary (lines 595–595) is carried at docs/platform/proposals/knowledge-registry-redesign.md#15-canary (lines 619–619); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 15. Canary

Migration is not the first writer test.

A separate writer canary must run before migration apply:

1. register a real topic or use a fixture topic;
2. reserve one document slot;
3. render one document in the new layout;
4. commit it;
5. attest the capture to the registered current path;
6. mark rendered to provisional;
7. verify document-source lookup returns the capture;
8. verify the index/projection shows the document;
9. verify an unregistered path is refused.

This proves the writer is registry-first. Migration tooling proves folding. They are separate concerns.
```

### Full target shown text

```text
## 15. Canary

Migration is not the first writer test.

A separate writer canary must run before migration apply:

1. register a real topic or use a fixture topic;
2. reserve one document slot;
3. render one document in the new layout;
4. commit it;
5. attest the capture to the registered current path;
6. mark rendered to provisional;
7. verify document-source lookup returns the capture;
8. verify the index/projection shows the document;
9. verify an unregistered path is refused.

This proves the writer is registry-first. Migration tooling proves folding. They are separate concerns.
```

## claim_108440079fd40af5d8274092de885cf7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-121, lines 597–597.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-124.
Source digest: 07e57cded6500378dd32d3e2fa2adef4b71f7b31a98899cf87051015e88fe7d4
Target digest: 07e57cded6500378dd32d3e2fa2adef4b71f7b31a98899cf87051015e88fe7d4
Shown source SHA256: 07e57cded6500378dd32d3e2fa2adef4b71f7b31a98899cf87051015e88fe7d4
Shown target SHA256: 07e57cded6500378dd32d3e2fa2adef4b71f7b31a98899cf87051015e88fe7d4

### Proposed decision

```json
{
  "claimId": "claim_108440079fd40af5d8274092de885cf7",
  "sourceUnitDigest": "07e57cded6500378dd32d3e2fa2adef4b71f7b31a98899cf87051015e88fe7d4",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-124",
  "targetUnitDigest": "07e57cded6500378dd32d3e2fa2adef4b71f7b31a98899cf87051015e88fe7d4",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "15. Canary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-121 (lines 597–597) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-124 (lines 621–621); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Migration is not the first writer test.
```

### Full target shown text

```text
Migration is not the first writer test.
```

## claim_c826b387f861a800a0882a989c3bec45

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-122, lines 599–599.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-125.
Source digest: 3cc4ba50ff7ef0116655e7560c29b7717a5c990e38ceeb39601cd33b9f37aa26
Target digest: 3cc4ba50ff7ef0116655e7560c29b7717a5c990e38ceeb39601cd33b9f37aa26
Shown source SHA256: 3cc4ba50ff7ef0116655e7560c29b7717a5c990e38ceeb39601cd33b9f37aa26
Shown target SHA256: 3cc4ba50ff7ef0116655e7560c29b7717a5c990e38ceeb39601cd33b9f37aa26

### Proposed decision

```json
{
  "claimId": "claim_c826b387f861a800a0882a989c3bec45",
  "sourceUnitDigest": "3cc4ba50ff7ef0116655e7560c29b7717a5c990e38ceeb39601cd33b9f37aa26",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-125",
  "targetUnitDigest": "3cc4ba50ff7ef0116655e7560c29b7717a5c990e38ceeb39601cd33b9f37aa26",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "15. Canary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-122 (lines 599–599) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-125 (lines 623–623); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
A separate writer canary must run before migration apply:
```

### Full target shown text

```text
A separate writer canary must run before migration apply:
```

## claim_4eea084e635842593d048fc355cb3ae3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-123, lines 601–609.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-126.
Source digest: 1c00e9e3831f8d1c9cc0251f6c1fdb1cdc60019e5ad1a6cd486ecee296333bb9
Target digest: 1c00e9e3831f8d1c9cc0251f6c1fdb1cdc60019e5ad1a6cd486ecee296333bb9
Shown source SHA256: 1c00e9e3831f8d1c9cc0251f6c1fdb1cdc60019e5ad1a6cd486ecee296333bb9
Shown target SHA256: 1c00e9e3831f8d1c9cc0251f6c1fdb1cdc60019e5ad1a6cd486ecee296333bb9

### Proposed decision

```json
{
  "claimId": "claim_4eea084e635842593d048fc355cb3ae3",
  "sourceUnitDigest": "1c00e9e3831f8d1c9cc0251f6c1fdb1cdc60019e5ad1a6cd486ecee296333bb9",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-126",
  "targetUnitDigest": "1c00e9e3831f8d1c9cc0251f6c1fdb1cdc60019e5ad1a6cd486ecee296333bb9",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "15. Canary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-123 (lines 601–609) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-126 (lines 625–633); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
1. register a real topic or use a fixture topic;
2. reserve one document slot;
3. render one document in the new layout;
4. commit it;
5. attest the capture to the registered current path;
6. mark rendered to provisional;
7. verify document-source lookup returns the capture;
8. verify the index/projection shows the document;
9. verify an unregistered path is refused.
```

### Full target shown text

```text
1. register a real topic or use a fixture topic;
2. reserve one document slot;
3. render one document in the new layout;
4. commit it;
5. attest the capture to the registered current path;
6. mark rendered to provisional;
7. verify document-source lookup returns the capture;
8. verify the index/projection shows the document;
9. verify an unregistered path is refused.
```

## claim_7123d9f550d3b23d72d012bb6480b60c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-124, lines 611–611.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-127.
Source digest: 15a45d709f53dc9a03aaa6ed850aea47c2879ad2358e90575df11aa8a91e9072
Target digest: 15a45d709f53dc9a03aaa6ed850aea47c2879ad2358e90575df11aa8a91e9072
Shown source SHA256: 15a45d709f53dc9a03aaa6ed850aea47c2879ad2358e90575df11aa8a91e9072
Shown target SHA256: 15a45d709f53dc9a03aaa6ed850aea47c2879ad2358e90575df11aa8a91e9072

### Proposed decision

```json
{
  "claimId": "claim_7123d9f550d3b23d72d012bb6480b60c",
  "sourceUnitDigest": "15a45d709f53dc9a03aaa6ed850aea47c2879ad2358e90575df11aa8a91e9072",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-127",
  "targetUnitDigest": "15a45d709f53dc9a03aaa6ed850aea47c2879ad2358e90575df11aa8a91e9072",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "15. Canary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-124 (lines 611–611) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-127 (lines 635–635); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
This proves the writer is registry-first. Migration tooling proves folding. They are separate concerns.
```

### Full target shown text

```text
This proves the writer is registry-first. Migration tooling proves folding. They are separate concerns.
```

## claim_e513f8c463fea1c129b56b8dd7e533b0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#16-open-questions, lines 613–613.
Target: docs/platform/proposals/knowledge-registry-redesign.md#16-open-questions.
Source digest: 4a064eec8fca522cdf1941f24d6479e3485a39ea40c211b3ccf7110c52251e8a
Target digest: 4a064eec8fca522cdf1941f24d6479e3485a39ea40c211b3ccf7110c52251e8a
Shown source SHA256: a3fe66781a6f529f9b3e3053f97e1903c43c489297d46062822b2cd53a3c6df0
Shown target SHA256: a3fe66781a6f529f9b3e3053f97e1903c43c489297d46062822b2cd53a3c6df0

### Proposed decision

```json
{
  "claimId": "claim_e513f8c463fea1c129b56b8dd7e533b0",
  "sourceUnitDigest": "4a064eec8fca522cdf1941f24d6479e3485a39ea40c211b3ccf7110c52251e8a",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "16-open-questions",
  "targetUnitDigest": "4a064eec8fca522cdf1941f24d6479e3485a39ea40c211b3ccf7110c52251e8a",
  "targetAncestry": [
    "Knowledge Registry Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#16-open-questions (lines 613–613) is carried at docs/platform/proposals/knowledge-registry-redesign.md#16-open-questions (lines 637–637); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 16. Open Questions

1. Should `doc.mark-rendered` ever move directly to `active` when the topic and document slot were explicitly registered by a human?
2. What is the initial role vocabulary after bottom-up classification?
3. What size threshold triggers `doc-topic-oversized`, and should it be count-based, byte-based, source-capture-based, or mixed?
4. What near-duplicate heuristic is good enough for the first version: skeleton match, entity overlap, title overlap, source-capture relation, or a measured weighted score?
5. How many aged provisional documents are acceptable before the system must ask for batch promotion/retirement?
6. Which existing end-user docs should be excluded from migration, if any, and why?
```

### Full target shown text

```text
## 16. Open Questions

1. Should `doc.mark-rendered` ever move directly to `active` when the topic and document slot were explicitly registered by a human?
2. What is the initial role vocabulary after bottom-up classification?
3. What size threshold triggers `doc-topic-oversized`, and should it be count-based, byte-based, source-capture-based, or mixed?
4. What near-duplicate heuristic is good enough for the first version: skeleton match, entity overlap, title overlap, source-capture relation, or a measured weighted score?
5. How many aged provisional documents are acceptable before the system must ask for batch promotion/retirement?
6. Which existing end-user docs should be excluded from migration, if any, and why?
```

## claim_bdff3ee136b7f5677541747601bea285

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-125, lines 615–620.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-128.
Source digest: b220f9f4c54a049336a5c3c09daaabcfacce03def7a9d5a097e86cec88e674f1
Target digest: b220f9f4c54a049336a5c3c09daaabcfacce03def7a9d5a097e86cec88e674f1
Shown source SHA256: b220f9f4c54a049336a5c3c09daaabcfacce03def7a9d5a097e86cec88e674f1
Shown target SHA256: b220f9f4c54a049336a5c3c09daaabcfacce03def7a9d5a097e86cec88e674f1

### Proposed decision

```json
{
  "claimId": "claim_bdff3ee136b7f5677541747601bea285",
  "sourceUnitDigest": "b220f9f4c54a049336a5c3c09daaabcfacce03def7a9d5a097e86cec88e674f1",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-128",
  "targetUnitDigest": "b220f9f4c54a049336a5c3c09daaabcfacce03def7a9d5a097e86cec88e674f1",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "16. Open Questions"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-125 (lines 615–620) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-128 (lines 639–644); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
1. Should `doc.mark-rendered` ever move directly to `active` when the topic and document slot were explicitly registered by a human?
2. What is the initial role vocabulary after bottom-up classification?
3. What size threshold triggers `doc-topic-oversized`, and should it be count-based, byte-based, source-capture-based, or mixed?
4. What near-duplicate heuristic is good enough for the first version: skeleton match, entity overlap, title overlap, source-capture relation, or a measured weighted score?
5. How many aged provisional documents are acceptable before the system must ask for batch promotion/retirement?
6. Which existing end-user docs should be excluded from migration, if any, and why?
```

### Full target shown text

```text
1. Should `doc.mark-rendered` ever move directly to `active` when the topic and document slot were explicitly registered by a human?
2. What is the initial role vocabulary after bottom-up classification?
3. What size threshold triggers `doc-topic-oversized`, and should it be count-based, byte-based, source-capture-based, or mixed?
4. What near-duplicate heuristic is good enough for the first version: skeleton match, entity overlap, title overlap, source-capture relation, or a measured weighted score?
5. How many aged provisional documents are acceptable before the system must ask for batch promotion/retirement?
6. Which existing end-user docs should be excluded from migration, if any, and why?
```

## claim_c262ad8c4a5f18b68948f937e3361128

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **yes**. Mechanical class: Judgment.
Source: docs/architect/knowledge-registry-redesign.md#17-pointers, lines 622–622.
Target: docs/platform/proposals/knowledge-registry-redesign.md#17-pointers.
Source digest: b019979bf1d88eeaf2cfa68ad8d7e8fc951959e46faac8093a52b666c753490b
Target digest: b9e92e3f9e07c42ec76e70ea5444f77e324c9ada6d5afcd03e3e239097da7b6d
Shown source SHA256: 385048afa4fe2cb7ff0ae658a07c2020580bac4ef14c4d83b56c63a258dc1068
Shown target SHA256: 86be0f4c8f94c11e4dba5921db22ff2bfdad77821e072b8f4eb63f9d561dd502

### Proposed decision

```json
{
  "claimId": "claim_c262ad8c4a5f18b68948f937e3361128",
  "sourceUnitDigest": "b019979bf1d88eeaf2cfa68ad8d7e8fc951959e46faac8093a52b666c753490b",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "17-pointers",
  "targetUnitDigest": "b9e92e3f9e07c42ec76e70ea5444f77e324c9ada6d5afcd03e3e239097da7b6d",
  "targetAncestry": [
    "Knowledge Registry Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
  "rationale": "Judgment: authorized correction changes target digest; mandatory A36 deep read. supersede: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#17-pointers (lines 622–622) is carried at docs/platform/proposals/knowledge-registry-redesign.md#17-pointers (lines 646–646); Frozen map target and kind retained. Target digest differs; the full unit requires A36 deep read against its source and the recorded correction. Only the two authorized false path sentences differ semantically; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Authorized A19/A28 item 3(a) correction of exactly two current-path sentences: compounding skill is domains/coding/skills/fgos-coding-knowledge/SKILL.md (c1768fa51); advisor report is plans/reports/for-external-advisor-260825-1209-doc-identity-axis-topic-registry-design-report.md. A22 binding consequence only; independent truth review still pending."
}
```

### Full source shown text

```text
## 17. Pointers

- Source discussion: `docs/history/compound-learn-artifact-registry/DISCUSSION.md`.
- Advisor prompt/report: `.claude/worktrees/tsk-28x-JQyqK4/plans/reports/for-external-advisor-260825-1209-doc-identity-axis-topic-registry-design-report.md`.
- Current write-side spec: `docs/specs/enduser-docs-authoring.md`.
- Current read-side spec: `docs/specs/enduser-docs-index.md`.
- Current compounding skill: `domains/coding/skills/fgos-coding-compounding/SKILL.md`.
- Current producer command: `bin/fgos.mjs`, legacy `compound` branch.
- Current authoritative-topic helper: `src/report/authoritative-match.mjs`.
- Current frontmatter helper: `src/report/frontmatter.mjs`.
- Current index helpers: `src/report/enduser-index.mjs` and `src/report/enduser-index-generate.mjs`.
```

### Full target shown text

```text
## 17. Pointers

- Source discussion: `docs/history/compound-learn-artifact-registry/DISCUSSION.md`.
- Advisor prompt/report: `plans/reports/for-external-advisor-260825-1209-doc-identity-axis-topic-registry-design-report.md`.
- Current write-side spec: `docs/specs/enduser-docs-authoring.md`.
- Current read-side spec: `docs/specs/enduser-docs-index.md`.
- Current compounding skill: `domains/coding/skills/fgos-coding-knowledge/SKILL.md`.
- Current producer command: `bin/fgos.mjs`, legacy `compound` branch.
- Current authoritative-topic helper: `src/report/authoritative-match.mjs`.
- Current frontmatter helper: `src/report/frontmatter.mjs`.
- Current index helpers: `src/report/enduser-index.mjs` and `src/report/enduser-index-generate.mjs`.
```

### Correction before/after and reasons

```json
{
  "claimId": "claim_c262ad8c4a5f18b68948f937e3361128",
  "source": "docs/architect/knowledge-registry-redesign.md",
  "shard": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-06-knowledge-registry-redesign.json",
  "reasons": [
    "A19/A28 two-sentence truth correction; A22 binding consequence",
    "A19 truth correction and extracted-unit consequence",
    "Corrected evidence, placement rationale or A36 class"
  ],
  "before": {
    "claimId": "claim_c262ad8c4a5f18b68948f937e3361128",
    "sourceUnitDigest": "b019979bf1d88eeaf2cfa68ad8d7e8fc951959e46faac8093a52b666c753490b",
    "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
    "targetAnchor": "17-pointers",
    "targetUnitDigest": "b019979bf1d88eeaf2cfa68ad8d7e8fc951959e46faac8093a52b666c753490b",
    "targetAncestry": [
      "Knowledge Registry Redesign"
    ],
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
    "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#17-pointers (lines 622–622) is carried at docs/platform/proposals/knowledge-registry-redesign.md#17-pointers (lines 646–646); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
  },
  "after": {
    "claimId": "claim_c262ad8c4a5f18b68948f937e3361128",
    "sourceUnitDigest": "b019979bf1d88eeaf2cfa68ad8d7e8fc951959e46faac8093a52b666c753490b",
    "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
    "targetAnchor": "17-pointers",
    "targetUnitDigest": "b9e92e3f9e07c42ec76e70ea5444f77e324c9ada6d5afcd03e3e239097da7b6d",
    "targetAncestry": [
      "Knowledge Registry Redesign"
    ],
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
    "rationale": "Judgment: authorized correction changes target digest; mandatory A36 deep read. supersede: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#17-pointers (lines 622–622) is carried at docs/platform/proposals/knowledge-registry-redesign.md#17-pointers (lines 646–646); Frozen map target and kind retained. Target digest differs; the full unit requires A36 deep read against its source and the recorded correction. Only the two authorized false path sentences differ semantically; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Authorized A19/A28 item 3(a) correction of exactly two current-path sentences: compounding skill is domains/coding/skills/fgos-coding-knowledge/SKILL.md (c1768fa51); advisor report is plans/reports/for-external-advisor-260825-1209-doc-identity-axis-topic-registry-design-report.md. A22 binding consequence only; independent truth review still pending."
  }
}
```

## claim_0662afe5df2b25be15d682a21eb1117a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **yes**. Mechanical class: Judgment.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-126, lines 624–632.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-129.
Source digest: 26b28b7c0822bb346cf937db7a127d9a48eb0b128f1eb8fc9284c4e5e1cabfd0
Target digest: c1b2102209e23ddb3b0855a4c061f4185abe5e5cbbc0fb8fb7c3665623b6527f
Shown source SHA256: 26b28b7c0822bb346cf937db7a127d9a48eb0b128f1eb8fc9284c4e5e1cabfd0
Shown target SHA256: c1b2102209e23ddb3b0855a4c061f4185abe5e5cbbc0fb8fb7c3665623b6527f

### Proposed decision

```json
{
  "claimId": "claim_0662afe5df2b25be15d682a21eb1117a",
  "sourceUnitDigest": "26b28b7c0822bb346cf937db7a127d9a48eb0b128f1eb8fc9284c4e5e1cabfd0",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-129",
  "targetUnitDigest": "c1b2102209e23ddb3b0855a4c061f4185abe5e5cbbc0fb8fb7c3665623b6527f",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "17. Pointers"
  ],
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
  "rationale": "Judgment: authorized correction changes target digest; mandatory A36 deep read. supersede: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-126 (lines 624–632) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-129 (lines 648–656); Frozen map target and kind retained. Target digest differs; the full unit requires A36 deep read against its source and the recorded correction. Only the two authorized false path sentences differ semantically; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Authorized A19/A28 item 3(a) correction of exactly two current-path sentences: compounding skill is domains/coding/skills/fgos-coding-knowledge/SKILL.md (c1768fa51); advisor report is plans/reports/for-external-advisor-260825-1209-doc-identity-axis-topic-registry-design-report.md. A22 binding consequence only; independent truth review still pending."
}
```

### Full source shown text

```text
- Source discussion: `docs/history/compound-learn-artifact-registry/DISCUSSION.md`.
- Advisor prompt/report: `.claude/worktrees/tsk-28x-JQyqK4/plans/reports/for-external-advisor-260825-1209-doc-identity-axis-topic-registry-design-report.md`.
- Current write-side spec: `docs/specs/enduser-docs-authoring.md`.
- Current read-side spec: `docs/specs/enduser-docs-index.md`.
- Current compounding skill: `domains/coding/skills/fgos-coding-compounding/SKILL.md`.
- Current producer command: `bin/fgos.mjs`, legacy `compound` branch.
- Current authoritative-topic helper: `src/report/authoritative-match.mjs`.
- Current frontmatter helper: `src/report/frontmatter.mjs`.
- Current index helpers: `src/report/enduser-index.mjs` and `src/report/enduser-index-generate.mjs`.
```

### Full target shown text

```text
- Source discussion: `docs/history/compound-learn-artifact-registry/DISCUSSION.md`.
- Advisor prompt/report: `plans/reports/for-external-advisor-260825-1209-doc-identity-axis-topic-registry-design-report.md`.
- Current write-side spec: `docs/specs/enduser-docs-authoring.md`.
- Current read-side spec: `docs/specs/enduser-docs-index.md`.
- Current compounding skill: `domains/coding/skills/fgos-coding-knowledge/SKILL.md`.
- Current producer command: `bin/fgos.mjs`, legacy `compound` branch.
- Current authoritative-topic helper: `src/report/authoritative-match.mjs`.
- Current frontmatter helper: `src/report/frontmatter.mjs`.
- Current index helpers: `src/report/enduser-index.mjs` and `src/report/enduser-index-generate.mjs`.
```

### Correction before/after and reasons

```json
{
  "claimId": "claim_0662afe5df2b25be15d682a21eb1117a",
  "source": "docs/architect/knowledge-registry-redesign.md",
  "shard": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-06-knowledge-registry-redesign.json",
  "reasons": [
    "A19/A28 two-sentence truth correction; A22 binding consequence",
    "A19 truth correction and extracted-unit consequence",
    "Corrected evidence, placement rationale or A36 class"
  ],
  "before": {
    "claimId": "claim_0662afe5df2b25be15d682a21eb1117a",
    "sourceUnitDigest": "26b28b7c0822bb346cf937db7a127d9a48eb0b128f1eb8fc9284c4e5e1cabfd0",
    "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
    "targetAnchor": "unheaded-block-129",
    "targetUnitDigest": "26b28b7c0822bb346cf937db7a127d9a48eb0b128f1eb8fc9284c4e5e1cabfd0",
    "targetAncestry": [
      "Knowledge Registry Redesign",
      "17. Pointers"
    ],
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-126 (lines 624–632) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-129 (lines 648–656); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
  },
  "after": {
    "claimId": "claim_0662afe5df2b25be15d682a21eb1117a",
    "sourceUnitDigest": "26b28b7c0822bb346cf937db7a127d9a48eb0b128f1eb8fc9284c4e5e1cabfd0",
    "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
    "targetAnchor": "unheaded-block-129",
    "targetUnitDigest": "c1b2102209e23ddb3b0855a4c061f4185abe5e5cbbc0fb8fb7c3665623b6527f",
    "targetAncestry": [
      "Knowledge Registry Redesign",
      "17. Pointers"
    ],
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
    "rationale": "Judgment: authorized correction changes target digest; mandatory A36 deep read. supersede: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-126 (lines 624–632) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-129 (lines 648–656); Frozen map target and kind retained. Target digest differs; the full unit requires A36 deep read against its source and the recorded correction. Only the two authorized false path sentences differ semantically; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Authorized A19/A28 item 3(a) correction of exactly two current-path sentences: compounding skill is domains/coding/skills/fgos-coding-knowledge/SKILL.md (c1768fa51); advisor report is plans/reports/for-external-advisor-260825-1209-doc-identity-axis-topic-registry-design-report.md. A22 binding consequence only; independent truth review still pending."
  }
}
```

## claim_ba79e248cfab93db23161396b94070c1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#18-implementation-tasks, lines 634–634.
Target: docs/platform/proposals/knowledge-registry-redesign.md#18-implementation-tasks.
Source digest: 6522b578368538d135e910ab26d3d770f1c622451e7bc286ff4c7f7ab4087974
Target digest: 6522b578368538d135e910ab26d3d770f1c622451e7bc286ff4c7f7ab4087974
Shown source SHA256: b18d58a67e4f881aecf8145b812f58892d884c32daf5b288bb6f62f5910c29a6
Shown target SHA256: b18d58a67e4f881aecf8145b812f58892d884c32daf5b288bb6f62f5910c29a6

### Proposed decision

```json
{
  "claimId": "claim_ba79e248cfab93db23161396b94070c1",
  "sourceUnitDigest": "6522b578368538d135e910ab26d3d770f1c622451e7bc286ff4c7f7ab4087974",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "18-implementation-tasks",
  "targetUnitDigest": "6522b578368538d135e910ab26d3d770f1c622451e7bc286ff4c7f7ab4087974",
  "targetAncestry": [
    "Knowledge Registry Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#18-implementation-tasks (lines 634–634) is carried at docs/platform/proposals/knowledge-registry-redesign.md#18-implementation-tasks (lines 658–658); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 18. Implementation Tasks

Work items that carried this design into code, in the order they were built. All `delivered`.

| id | title |
|---|---|
| `tsk-28x` | Extensible multi-audience artifact-producer registry for fgOS's compound-learn/retrospective (root item) |
| `tsk-28x-1` | Knowledge registry domain model: `topic.*` / `doc.*` events, reducer, invariants |
| `tsk-28x-2` | Resolver `oldPath` -> `currentPath` qua aliases + lineage, chưa đổi consumer nào |
| `tsk-28x-3` | Classifier/inventory dry-run trên 268 tài liệu |
| `tsk-28x-4` | Bootstrap registry bằng chính output classifier (`currentPath=oldPath`), idempotent và chạy lại được |
| `tsk-28x-5` | Verb surfaces: `fgos topic register\|split\|merge\|rename\|retire` và `fgos doc *` |
| `tsk-28x-6` | `fgos knowledge attest` + registry gate 4 điều kiện (alias KHÔNG được tag) + cờ `docRegistry.enforce` |
| `tsk-28x-7` | `doc-sources` và `docs-index` đọc qua resolver: `oldPath` vẫn trả capture sau khi đổi, `currentPath` gom đúng |
| `tsk-28x-8` | Hai ảnh cuối cùng (JSON cho máy + Markdown cho người) và 8 doctor check knowledge |
| `tsk-28x-9` | Skill `fgos-coding-knowledge`: đổi từ chọn-quadrant-tự-đặt-path sang registry-first |
| `tsk-28x-10` | Writer canary: một item thật đi hết đường writer mới, là cổng trước migration |
| `tsk-28x-11` | Migration dry-run (inventory + conservation gate) rồi apply/fold 268 tài liệu theo từng target |
| `tsk-28x-12` | Deprecate `fgos compound` trỏ sang `fgos knowledge attest`, cập nhật spec/hard-rule/CHANGELOG |
| `tsk-3uc` | Fix 4 gap thật trong lifecycle/migration/bootstrap enforcement phát hiện qua code review (follow-on tsk-28x): `doc.register` lifecycle bypass, attest vào doc đã superseded, `topic.merge`/`split` chống non-active source/target, `topic.retire` silent no-op, `doc.supersede` successor không validate, migration partial-apply + shell-interpolated `git mv`/`add`, bootstrap partial-write across rows, path-traversal trong slug/path, `resolveDocPath` supersededBy chain |

Trạng thái thật đã verify trực tiếp (không chỉ dựa `delivered`), tại thời điểm `tsk-3uc` merge (2026-08-27): registry đã bootstrap thật 332/332 topic + 332/332 doc `active`; migration apply thật (bước 9, `tsk-28x-11`'s cutover) **chưa chạy** — phần lớn corpus vẫn ở layout quadrant cũ; `docRegistry.enforce` **vẫn `false`** trong `.fgos/config.json` — cổng chặn 4-điều-kiện (`tsk-28x-6`) có code nhưng chưa bật. Track B3 (integration harness sau migration thật) và B6 (metrics harness) chưa làm.
```

### Full target shown text

```text
## 18. Implementation Tasks

Work items that carried this design into code, in the order they were built. All `delivered`.

| id | title |
|---|---|
| `tsk-28x` | Extensible multi-audience artifact-producer registry for fgOS's compound-learn/retrospective (root item) |
| `tsk-28x-1` | Knowledge registry domain model: `topic.*` / `doc.*` events, reducer, invariants |
| `tsk-28x-2` | Resolver `oldPath` -> `currentPath` qua aliases + lineage, chưa đổi consumer nào |
| `tsk-28x-3` | Classifier/inventory dry-run trên 268 tài liệu |
| `tsk-28x-4` | Bootstrap registry bằng chính output classifier (`currentPath=oldPath`), idempotent và chạy lại được |
| `tsk-28x-5` | Verb surfaces: `fgos topic register\|split\|merge\|rename\|retire` và `fgos doc *` |
| `tsk-28x-6` | `fgos knowledge attest` + registry gate 4 điều kiện (alias KHÔNG được tag) + cờ `docRegistry.enforce` |
| `tsk-28x-7` | `doc-sources` và `docs-index` đọc qua resolver: `oldPath` vẫn trả capture sau khi đổi, `currentPath` gom đúng |
| `tsk-28x-8` | Hai ảnh cuối cùng (JSON cho máy + Markdown cho người) và 8 doctor check knowledge |
| `tsk-28x-9` | Skill `fgos-coding-knowledge`: đổi từ chọn-quadrant-tự-đặt-path sang registry-first |
| `tsk-28x-10` | Writer canary: một item thật đi hết đường writer mới, là cổng trước migration |
| `tsk-28x-11` | Migration dry-run (inventory + conservation gate) rồi apply/fold 268 tài liệu theo từng target |
| `tsk-28x-12` | Deprecate `fgos compound` trỏ sang `fgos knowledge attest`, cập nhật spec/hard-rule/CHANGELOG |
| `tsk-3uc` | Fix 4 gap thật trong lifecycle/migration/bootstrap enforcement phát hiện qua code review (follow-on tsk-28x): `doc.register` lifecycle bypass, attest vào doc đã superseded, `topic.merge`/`split` chống non-active source/target, `topic.retire` silent no-op, `doc.supersede` successor không validate, migration partial-apply + shell-interpolated `git mv`/`add`, bootstrap partial-write across rows, path-traversal trong slug/path, `resolveDocPath` supersededBy chain |

Trạng thái thật đã verify trực tiếp (không chỉ dựa `delivered`), tại thời điểm `tsk-3uc` merge (2026-08-27): registry đã bootstrap thật 332/332 topic + 332/332 doc `active`; migration apply thật (bước 9, `tsk-28x-11`'s cutover) **chưa chạy** — phần lớn corpus vẫn ở layout quadrant cũ; `docRegistry.enforce` **vẫn `false`** trong `.fgos/config.json` — cổng chặn 4-điều-kiện (`tsk-28x-6`) có code nhưng chưa bật. Track B3 (integration harness sau migration thật) và B6 (metrics harness) chưa làm.
```

## claim_a6815ae673ce514884178b01e916bf4c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-127, lines 636–636.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-130.
Source digest: 338d8787304268c1c0239ca1052f35c3d892948c7e416f6ff00947904c43c178
Target digest: 338d8787304268c1c0239ca1052f35c3d892948c7e416f6ff00947904c43c178
Shown source SHA256: 338d8787304268c1c0239ca1052f35c3d892948c7e416f6ff00947904c43c178
Shown target SHA256: 338d8787304268c1c0239ca1052f35c3d892948c7e416f6ff00947904c43c178

### Proposed decision

```json
{
  "claimId": "claim_a6815ae673ce514884178b01e916bf4c",
  "sourceUnitDigest": "338d8787304268c1c0239ca1052f35c3d892948c7e416f6ff00947904c43c178",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-130",
  "targetUnitDigest": "338d8787304268c1c0239ca1052f35c3d892948c7e416f6ff00947904c43c178",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "18. Implementation Tasks"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-127 (lines 636–636) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-130 (lines 660–660); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Work items that carried this design into code, in the order they were built. All `delivered`.
```

### Full target shown text

```text
Work items that carried this design into code, in the order they were built. All `delivered`.
```

## claim_6d6f673a3a120a7962d3c3cf2c8e56f3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-128, lines 638–653.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-131.
Source digest: 58120caa13ea94ac7356888716fca4ec811ad6e270e8c2b009ed2eb30a3f5921
Target digest: 58120caa13ea94ac7356888716fca4ec811ad6e270e8c2b009ed2eb30a3f5921
Shown source SHA256: 58120caa13ea94ac7356888716fca4ec811ad6e270e8c2b009ed2eb30a3f5921
Shown target SHA256: 58120caa13ea94ac7356888716fca4ec811ad6e270e8c2b009ed2eb30a3f5921

### Proposed decision

```json
{
  "claimId": "claim_6d6f673a3a120a7962d3c3cf2c8e56f3",
  "sourceUnitDigest": "58120caa13ea94ac7356888716fca4ec811ad6e270e8c2b009ed2eb30a3f5921",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-131",
  "targetUnitDigest": "58120caa13ea94ac7356888716fca4ec811ad6e270e8c2b009ed2eb30a3f5921",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "18. Implementation Tasks"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-128 (lines 638–653) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-131 (lines 662–677); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
| id | title |
|---|---|
| `tsk-28x` | Extensible multi-audience artifact-producer registry for fgOS's compound-learn/retrospective (root item) |
| `tsk-28x-1` | Knowledge registry domain model: `topic.*` / `doc.*` events, reducer, invariants |
| `tsk-28x-2` | Resolver `oldPath` -> `currentPath` qua aliases + lineage, chưa đổi consumer nào |
| `tsk-28x-3` | Classifier/inventory dry-run trên 268 tài liệu |
| `tsk-28x-4` | Bootstrap registry bằng chính output classifier (`currentPath=oldPath`), idempotent và chạy lại được |
| `tsk-28x-5` | Verb surfaces: `fgos topic register\|split\|merge\|rename\|retire` và `fgos doc *` |
| `tsk-28x-6` | `fgos knowledge attest` + registry gate 4 điều kiện (alias KHÔNG được tag) + cờ `docRegistry.enforce` |
| `tsk-28x-7` | `doc-sources` và `docs-index` đọc qua resolver: `oldPath` vẫn trả capture sau khi đổi, `currentPath` gom đúng |
| `tsk-28x-8` | Hai ảnh cuối cùng (JSON cho máy + Markdown cho người) và 8 doctor check knowledge |
| `tsk-28x-9` | Skill `fgos-coding-knowledge`: đổi từ chọn-quadrant-tự-đặt-path sang registry-first |
| `tsk-28x-10` | Writer canary: một item thật đi hết đường writer mới, là cổng trước migration |
| `tsk-28x-11` | Migration dry-run (inventory + conservation gate) rồi apply/fold 268 tài liệu theo từng target |
| `tsk-28x-12` | Deprecate `fgos compound` trỏ sang `fgos knowledge attest`, cập nhật spec/hard-rule/CHANGELOG |
| `tsk-3uc` | Fix 4 gap thật trong lifecycle/migration/bootstrap enforcement phát hiện qua code review (follow-on tsk-28x): `doc.register` lifecycle bypass, attest vào doc đã superseded, `topic.merge`/`split` chống non-active source/target, `topic.retire` silent no-op, `doc.supersede` successor không validate, migration partial-apply + shell-interpolated `git mv`/`add`, bootstrap partial-write across rows, path-traversal trong slug/path, `resolveDocPath` supersededBy chain |
```

### Full target shown text

```text
| id | title |
|---|---|
| `tsk-28x` | Extensible multi-audience artifact-producer registry for fgOS's compound-learn/retrospective (root item) |
| `tsk-28x-1` | Knowledge registry domain model: `topic.*` / `doc.*` events, reducer, invariants |
| `tsk-28x-2` | Resolver `oldPath` -> `currentPath` qua aliases + lineage, chưa đổi consumer nào |
| `tsk-28x-3` | Classifier/inventory dry-run trên 268 tài liệu |
| `tsk-28x-4` | Bootstrap registry bằng chính output classifier (`currentPath=oldPath`), idempotent và chạy lại được |
| `tsk-28x-5` | Verb surfaces: `fgos topic register\|split\|merge\|rename\|retire` và `fgos doc *` |
| `tsk-28x-6` | `fgos knowledge attest` + registry gate 4 điều kiện (alias KHÔNG được tag) + cờ `docRegistry.enforce` |
| `tsk-28x-7` | `doc-sources` và `docs-index` đọc qua resolver: `oldPath` vẫn trả capture sau khi đổi, `currentPath` gom đúng |
| `tsk-28x-8` | Hai ảnh cuối cùng (JSON cho máy + Markdown cho người) và 8 doctor check knowledge |
| `tsk-28x-9` | Skill `fgos-coding-knowledge`: đổi từ chọn-quadrant-tự-đặt-path sang registry-first |
| `tsk-28x-10` | Writer canary: một item thật đi hết đường writer mới, là cổng trước migration |
| `tsk-28x-11` | Migration dry-run (inventory + conservation gate) rồi apply/fold 268 tài liệu theo từng target |
| `tsk-28x-12` | Deprecate `fgos compound` trỏ sang `fgos knowledge attest`, cập nhật spec/hard-rule/CHANGELOG |
| `tsk-3uc` | Fix 4 gap thật trong lifecycle/migration/bootstrap enforcement phát hiện qua code review (follow-on tsk-28x): `doc.register` lifecycle bypass, attest vào doc đã superseded, `topic.merge`/`split` chống non-active source/target, `topic.retire` silent no-op, `doc.supersede` successor không validate, migration partial-apply + shell-interpolated `git mv`/`add`, bootstrap partial-write across rows, path-traversal trong slug/path, `resolveDocPath` supersededBy chain |
```

## claim_bacd7d4640e924a870e669308be3a605

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-129, lines 655–655.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-132.
Source digest: cdf24671237f7643935f9513e0ce39e7266e7cf332e43f00aff21d834a867f79
Target digest: cdf24671237f7643935f9513e0ce39e7266e7cf332e43f00aff21d834a867f79
Shown source SHA256: cdf24671237f7643935f9513e0ce39e7266e7cf332e43f00aff21d834a867f79
Shown target SHA256: cdf24671237f7643935f9513e0ce39e7266e7cf332e43f00aff21d834a867f79

### Proposed decision

```json
{
  "claimId": "claim_bacd7d4640e924a870e669308be3a605",
  "sourceUnitDigest": "cdf24671237f7643935f9513e0ce39e7266e7cf332e43f00aff21d834a867f79",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-132",
  "targetUnitDigest": "cdf24671237f7643935f9513e0ce39e7266e7cf332e43f00aff21d834a867f79",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "18. Implementation Tasks"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-129 (lines 655–655) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-132 (lines 679–679); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Trạng thái thật đã verify trực tiếp (không chỉ dựa `delivered`), tại thời điểm `tsk-3uc` merge (2026-08-27): registry đã bootstrap thật 332/332 topic + 332/332 doc `active`; migration apply thật (bước 9, `tsk-28x-11`'s cutover) **chưa chạy** — phần lớn corpus vẫn ở layout quadrant cũ; `docRegistry.enforce` **vẫn `false`** trong `.fgos/config.json` — cổng chặn 4-điều-kiện (`tsk-28x-6`) có code nhưng chưa bật. Track B3 (integration harness sau migration thật) và B6 (metrics harness) chưa làm.
```

### Full target shown text

```text
Trạng thái thật đã verify trực tiếp (không chỉ dựa `delivered`), tại thời điểm `tsk-3uc` merge (2026-08-27): registry đã bootstrap thật 332/332 topic + 332/332 doc `active`; migration apply thật (bước 9, `tsk-28x-11`'s cutover) **chưa chạy** — phần lớn corpus vẫn ở layout quadrant cũ; `docRegistry.enforce` **vẫn `false`** trong `.fgos/config.json` — cổng chặn 4-điều-kiện (`tsk-28x-6`) có code nhưng chưa bật. Track B3 (integration harness sau migration thật) và B6 (metrics harness) chưa làm.
```

## claim_3950494042efa057cf8e75c473f61e1c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#19-implementation-pointers, lines 657–657.
Target: docs/platform/proposals/knowledge-registry-redesign.md#19-implementation-pointers.
Source digest: d42883a9a29a03cea8e79aaecb1044b4230dcd89af46bac38e3f436e93c28f09
Target digest: d42883a9a29a03cea8e79aaecb1044b4230dcd89af46bac38e3f436e93c28f09
Shown source SHA256: 8ab56992b028113315a7503f64f441c8d42fb56b86d3ca222b57d4cf15926060
Shown target SHA256: 8ab56992b028113315a7503f64f441c8d42fb56b86d3ca222b57d4cf15926060

### Proposed decision

```json
{
  "claimId": "claim_3950494042efa057cf8e75c473f61e1c",
  "sourceUnitDigest": "d42883a9a29a03cea8e79aaecb1044b4230dcd89af46bac38e3f436e93c28f09",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "19-implementation-pointers",
  "targetUnitDigest": "d42883a9a29a03cea8e79aaecb1044b4230dcd89af46bac38e3f436e93c28f09",
  "targetAncestry": [
    "Knowledge Registry Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#19-implementation-pointers (lines 657–657) is carried at docs/platform/proposals/knowledge-registry-redesign.md#19-implementation-pointers (lines 681–681); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 19. Implementation Pointers

Real files landed by `tsk-28x`'s 12-phase build (`5c948d2a` and its
discovery/plan/Iron-Law-evidence siblings, isolated from unrelated files
picked up by main-catchup merges) plus `tsk-3uc`'s hardening pass
(commits matched by `git log --grep tsk-3uc --no-merges`). These supersede
§17's pre-implementation pointer list — §17 still records what the design
started from; this section records what actually exists in `src/`/`scripts/`
now.
```

### Full target shown text

```text
## 19. Implementation Pointers

Real files landed by `tsk-28x`'s 12-phase build (`5c948d2a` and its
discovery/plan/Iron-Law-evidence siblings, isolated from unrelated files
picked up by main-catchup merges) plus `tsk-3uc`'s hardening pass
(commits matched by `git log --grep tsk-3uc --no-merges`). These supersede
§17's pre-implementation pointer list — §17 still records what the design
started from; this section records what actually exists in `src/`/`scripts/`
now.
```

## claim_49fbaaa04f26c01623acf7d71a72c7f7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-130, lines 659–665.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-133.
Source digest: d7077dc32dac446fb9007079650935748da9994b300c7d3eb7a5919bfa13f60b
Target digest: d7077dc32dac446fb9007079650935748da9994b300c7d3eb7a5919bfa13f60b
Shown source SHA256: d7077dc32dac446fb9007079650935748da9994b300c7d3eb7a5919bfa13f60b
Shown target SHA256: d7077dc32dac446fb9007079650935748da9994b300c7d3eb7a5919bfa13f60b

### Proposed decision

```json
{
  "claimId": "claim_49fbaaa04f26c01623acf7d71a72c7f7",
  "sourceUnitDigest": "d7077dc32dac446fb9007079650935748da9994b300c7d3eb7a5919bfa13f60b",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-133",
  "targetUnitDigest": "d7077dc32dac446fb9007079650935748da9994b300c7d3eb7a5919bfa13f60b",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "19. Implementation Pointers"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-130 (lines 659–665) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-133 (lines 683–689); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Real files landed by `tsk-28x`'s 12-phase build (`5c948d2a` and its
discovery/plan/Iron-Law-evidence siblings, isolated from unrelated files
picked up by main-catchup merges) plus `tsk-3uc`'s hardening pass
(commits matched by `git log --grep tsk-3uc --no-merges`). These supersede
§17's pre-implementation pointer list — §17 still records what the design
started from; this section records what actually exists in `src/`/`scripts/`
now.
```

### Full target shown text

```text
Real files landed by `tsk-28x`'s 12-phase build (`5c948d2a` and its
discovery/plan/Iron-Law-evidence siblings, isolated from unrelated files
picked up by main-catchup merges) plus `tsk-3uc`'s hardening pass
(commits matched by `git log --grep tsk-3uc --no-merges`). These supersede
§17's pre-implementation pointer list — §17 still records what the design
started from; this section records what actually exists in `src/`/`scripts/`
now.
```

## claim_3911f4a91aea36c20cf83e77e8ad200e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#191-registry-model-and-resolver-6-7-9, lines 667–667.
Target: docs/platform/proposals/knowledge-registry-redesign.md#191-registry-model-and-resolver-6-7-9.
Source digest: 3fc538ad536e358d964b4a62b2e66f5aa2e0c3f47f8748081cafc1b3bff4dffb
Target digest: 3fc538ad536e358d964b4a62b2e66f5aa2e0c3f47f8748081cafc1b3bff4dffb
Shown source SHA256: 9d251fe96e1d59f89662e10257136bbb20d331eaf9ba4caf4e23fbbd24887b29
Shown target SHA256: 9d251fe96e1d59f89662e10257136bbb20d331eaf9ba4caf4e23fbbd24887b29

### Proposed decision

```json
{
  "claimId": "claim_3911f4a91aea36c20cf83e77e8ad200e",
  "sourceUnitDigest": "3fc538ad536e358d964b4a62b2e66f5aa2e0c3f47f8748081cafc1b3bff4dffb",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "191-registry-model-and-resolver-6-7-9",
  "targetUnitDigest": "3fc538ad536e358d964b4a62b2e66f5aa2e0c3f47f8748081cafc1b3bff4dffb",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "19. Implementation Pointers"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#191-registry-model-and-resolver-6-7-9 (lines 667–667) is carried at docs/platform/proposals/knowledge-registry-redesign.md#191-registry-model-and-resolver-6-7-9 (lines 691–691); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 19.1 Registry Model And Resolver (§6, §7, §9)

- `src/state/knowledge-registry.mjs` — the `topic.*`/`doc.*` event reducer,
  invariants (`activeDoc(topicId, role) <= 1`, role-vs-mode collision,
  supersession chain), and registry replay.
- `src/report/knowledge-resolver.mjs` — `resolveDocPath` (§9): current-path
  hit, alias hit, `supersededBy` chain walk, null on miss.
- `src/report/knowledge-projection.mjs` — machine (`docs/knowledge-registry.json`)
  and human (`docs/knowledge-registry.md`) projections (§10).
```

### Full target shown text

```text
### 19.1 Registry Model And Resolver (§6, §7, §9)

- `src/state/knowledge-registry.mjs` — the `topic.*`/`doc.*` event reducer,
  invariants (`activeDoc(topicId, role) <= 1`, role-vs-mode collision,
  supersession chain), and registry replay.
- `src/report/knowledge-resolver.mjs` — `resolveDocPath` (§9): current-path
  hit, alias hit, `supersededBy` chain walk, null on miss.
- `src/report/knowledge-projection.mjs` — machine (`docs/knowledge-registry.json`)
  and human (`docs/knowledge-registry.md`) projections (§10).
```

## claim_f607f04ed5ea3e6056ea77652d25d003

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-131, lines 669–675.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-134.
Source digest: 21c29003efa0c0efe78271c197c4e720c19bca7c037b8e530e6cb7eaed31f8f9
Target digest: 21c29003efa0c0efe78271c197c4e720c19bca7c037b8e530e6cb7eaed31f8f9
Shown source SHA256: 21c29003efa0c0efe78271c197c4e720c19bca7c037b8e530e6cb7eaed31f8f9
Shown target SHA256: 21c29003efa0c0efe78271c197c4e720c19bca7c037b8e530e6cb7eaed31f8f9

### Proposed decision

```json
{
  "claimId": "claim_f607f04ed5ea3e6056ea77652d25d003",
  "sourceUnitDigest": "21c29003efa0c0efe78271c197c4e720c19bca7c037b8e530e6cb7eaed31f8f9",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-134",
  "targetUnitDigest": "21c29003efa0c0efe78271c197c4e720c19bca7c037b8e530e6cb7eaed31f8f9",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "19. Implementation Pointers",
    "19.1 Registry Model And Resolver (§6, §7, §9)"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-131 (lines 669–675) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-134 (lines 693–699); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- `src/state/knowledge-registry.mjs` — the `topic.*`/`doc.*` event reducer,
  invariants (`activeDoc(topicId, role) <= 1`, role-vs-mode collision,
  supersession chain), and registry replay.
- `src/report/knowledge-resolver.mjs` — `resolveDocPath` (§9): current-path
  hit, alias hit, `supersededBy` chain walk, null on miss.
- `src/report/knowledge-projection.mjs` — machine (`docs/knowledge-registry.json`)
  and human (`docs/knowledge-registry.md`) projections (§10).
```

### Full target shown text

```text
- `src/state/knowledge-registry.mjs` — the `topic.*`/`doc.*` event reducer,
  invariants (`activeDoc(topicId, role) <= 1`, role-vs-mode collision,
  supersession chain), and registry replay.
- `src/report/knowledge-resolver.mjs` — `resolveDocPath` (§9): current-path
  hit, alias hit, `supersededBy` chain walk, null on miss.
- `src/report/knowledge-projection.mjs` — machine (`docs/knowledge-registry.json`)
  and human (`docs/knowledge-registry.md`) projections (§10).
```

## claim_920de8d726d9296fdb0bee975361bdcd

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#192-verb-surfaces-and-producer-gate-8-12, lines 677–677.
Target: docs/platform/proposals/knowledge-registry-redesign.md#192-verb-surfaces-and-producer-gate-8-12.
Source digest: a5674dc55d3953d8ef149de6b503cfb2bb3e8f30daaaef4fb67c58b0395e7696
Target digest: a5674dc55d3953d8ef149de6b503cfb2bb3e8f30daaaef4fb67c58b0395e7696
Shown source SHA256: 31186972299494620b337756ea674dd1efb2bedeb1d1c149d0139fb860393615
Shown target SHA256: 31186972299494620b337756ea674dd1efb2bedeb1d1c149d0139fb860393615

### Proposed decision

```json
{
  "claimId": "claim_920de8d726d9296fdb0bee975361bdcd",
  "sourceUnitDigest": "a5674dc55d3953d8ef149de6b503cfb2bb3e8f30daaaef4fb67c58b0395e7696",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "192-verb-surfaces-and-producer-gate-8-12",
  "targetUnitDigest": "a5674dc55d3953d8ef149de6b503cfb2bb3e8f30daaaef4fb67c58b0395e7696",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "19. Implementation Pointers"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#192-verb-surfaces-and-producer-gate-8-12 (lines 677–677) is carried at docs/platform/proposals/knowledge-registry-redesign.md#192-verb-surfaces-and-producer-gate-8-12 (lines 701–701); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 19.2 Verb Surfaces And Producer Gate (§8, §12)

- `bin/fgos.mjs` — `fgos topic register|split|merge|rename|retire`,
  `fgos doc reserve|mark-rendered|move-path|promote|supersede|retire`,
  `fgos knowledge attest`, and the legacy `fgos compound` compatibility
  branch routed through the same gate.
- `src/cli/command-registry.mjs` — CLI wiring for the verbs above.
- `src/state/store.mjs` — durable event validation for `topic.*`/`doc.*`
  ops, folded into the existing durable-store module.
- `src/state/replay.mjs` — registry projection hookup into the durable
  replay pipeline.
```

### Full target shown text

```text
### 19.2 Verb Surfaces And Producer Gate (§8, §12)

- `bin/fgos.mjs` — `fgos topic register|split|merge|rename|retire`,
  `fgos doc reserve|mark-rendered|move-path|promote|supersede|retire`,
  `fgos knowledge attest`, and the legacy `fgos compound` compatibility
  branch routed through the same gate.
- `src/cli/command-registry.mjs` — CLI wiring for the verbs above.
- `src/state/store.mjs` — durable event validation for `topic.*`/`doc.*`
  ops, folded into the existing durable-store module.
- `src/state/replay.mjs` — registry projection hookup into the durable
  replay pipeline.
```

## claim_98614ae5072457206fd70ab90416465c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-132, lines 679–687.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-135.
Source digest: 6eabcb5aa89f3e5d434e695da24181b22cf89da7a338724d3fb6abdb82093407
Target digest: 6eabcb5aa89f3e5d434e695da24181b22cf89da7a338724d3fb6abdb82093407
Shown source SHA256: 6eabcb5aa89f3e5d434e695da24181b22cf89da7a338724d3fb6abdb82093407
Shown target SHA256: 6eabcb5aa89f3e5d434e695da24181b22cf89da7a338724d3fb6abdb82093407

### Proposed decision

```json
{
  "claimId": "claim_98614ae5072457206fd70ab90416465c",
  "sourceUnitDigest": "6eabcb5aa89f3e5d434e695da24181b22cf89da7a338724d3fb6abdb82093407",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-135",
  "targetUnitDigest": "6eabcb5aa89f3e5d434e695da24181b22cf89da7a338724d3fb6abdb82093407",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "19. Implementation Pointers",
    "19.2 Verb Surfaces And Producer Gate (§8, §12)"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-132 (lines 679–687) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-135 (lines 703–711); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- `bin/fgos.mjs` — `fgos topic register|split|merge|rename|retire`,
  `fgos doc reserve|mark-rendered|move-path|promote|supersede|retire`,
  `fgos knowledge attest`, and the legacy `fgos compound` compatibility
  branch routed through the same gate.
- `src/cli/command-registry.mjs` — CLI wiring for the verbs above.
- `src/state/store.mjs` — durable event validation for `topic.*`/`doc.*`
  ops, folded into the existing durable-store module.
- `src/state/replay.mjs` — registry projection hookup into the durable
  replay pipeline.
```

### Full target shown text

```text
- `bin/fgos.mjs` — `fgos topic register|split|merge|rename|retire`,
  `fgos doc reserve|mark-rendered|move-path|promote|supersede|retire`,
  `fgos knowledge attest`, and the legacy `fgos compound` compatibility
  branch routed through the same gate.
- `src/cli/command-registry.mjs` — CLI wiring for the verbs above.
- `src/state/store.mjs` — durable event validation for `topic.*`/`doc.*`
  ops, folded into the existing durable-store module.
- `src/state/replay.mjs` — registry projection hookup into the durable
  replay pipeline.
```

## claim_08a88b2d5a32346b6c574857d6f059aa

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#193-classification-bootstrap-migration-canary-11-13-15, lines 689–689.
Target: docs/platform/proposals/knowledge-registry-redesign.md#193-classification-bootstrap-migration-canary-11-13-15.
Source digest: 6d877f840282153bde998ee3bb74b8bce25ebfb8221c07fc54fa44da0bc0b0c8
Target digest: 6d877f840282153bde998ee3bb74b8bce25ebfb8221c07fc54fa44da0bc0b0c8
Shown source SHA256: 9862ca35f1c314049bfaeaa9544ff9cd712aa0d87094e7ce38f4a2533654805e
Shown target SHA256: 9862ca35f1c314049bfaeaa9544ff9cd712aa0d87094e7ce38f4a2533654805e

### Proposed decision

```json
{
  "claimId": "claim_08a88b2d5a32346b6c574857d6f059aa",
  "sourceUnitDigest": "6d877f840282153bde998ee3bb74b8bce25ebfb8221c07fc54fa44da0bc0b0c8",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "193-classification-bootstrap-migration-canary-11-13-15",
  "targetUnitDigest": "6d877f840282153bde998ee3bb74b8bce25ebfb8221c07fc54fa44da0bc0b0c8",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "19. Implementation Pointers"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#193-classification-bootstrap-migration-canary-11-13-15 (lines 689–689) is carried at docs/platform/proposals/knowledge-registry-redesign.md#193-classification-bootstrap-migration-canary-11-13-15 (lines 713–713); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 19.3 Classification, Bootstrap, Migration, Canary (§11, §13, §15)

- `scripts/knowledge-classifier.mjs` — read-only inventory/classification
  pass (§13.1) over the pre-migration corpus.
- `scripts/knowledge-bootstrap.mjs` — bootstraps registry rows with
  `currentPath = oldPath`, idempotent (§13.2).
- `scripts/knowledge-migration.mjs` — dry-run/conservation/apply (§13.3-13.5):
  move-or-fold by target document, alias creation, projection rebuild.
- `scripts/knowledge-canary.mjs` — the pre-migration writer canary (§15).
```

### Full target shown text

```text
### 19.3 Classification, Bootstrap, Migration, Canary (§11, §13, §15)

- `scripts/knowledge-classifier.mjs` — read-only inventory/classification
  pass (§13.1) over the pre-migration corpus.
- `scripts/knowledge-bootstrap.mjs` — bootstraps registry rows with
  `currentPath = oldPath`, idempotent (§13.2).
- `scripts/knowledge-migration.mjs` — dry-run/conservation/apply (§13.3-13.5):
  move-or-fold by target document, alias creation, projection rebuild.
- `scripts/knowledge-canary.mjs` — the pre-migration writer canary (§15).
```

## claim_684ca92c2a56386ea8d800e1257e8813

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-133, lines 691–697.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-136.
Source digest: dd4594285fc178032d5fed5024d8bc2067f2875c8fcec978f846b878681dacd3
Target digest: dd4594285fc178032d5fed5024d8bc2067f2875c8fcec978f846b878681dacd3
Shown source SHA256: dd4594285fc178032d5fed5024d8bc2067f2875c8fcec978f846b878681dacd3
Shown target SHA256: dd4594285fc178032d5fed5024d8bc2067f2875c8fcec978f846b878681dacd3

### Proposed decision

```json
{
  "claimId": "claim_684ca92c2a56386ea8d800e1257e8813",
  "sourceUnitDigest": "dd4594285fc178032d5fed5024d8bc2067f2875c8fcec978f846b878681dacd3",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-136",
  "targetUnitDigest": "dd4594285fc178032d5fed5024d8bc2067f2875c8fcec978f846b878681dacd3",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "19. Implementation Pointers",
    "19.3 Classification, Bootstrap, Migration, Canary (§11, §13, §15)"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-133 (lines 691–697) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-136 (lines 715–721); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- `scripts/knowledge-classifier.mjs` — read-only inventory/classification
  pass (§13.1) over the pre-migration corpus.
- `scripts/knowledge-bootstrap.mjs` — bootstraps registry rows with
  `currentPath = oldPath`, idempotent (§13.2).
- `scripts/knowledge-migration.mjs` — dry-run/conservation/apply (§13.3-13.5):
  move-or-fold by target document, alias creation, projection rebuild.
- `scripts/knowledge-canary.mjs` — the pre-migration writer canary (§15).
```

### Full target shown text

```text
- `scripts/knowledge-classifier.mjs` — read-only inventory/classification
  pass (§13.1) over the pre-migration corpus.
- `scripts/knowledge-bootstrap.mjs` — bootstraps registry rows with
  `currentPath = oldPath`, idempotent (§13.2).
- `scripts/knowledge-migration.mjs` — dry-run/conservation/apply (§13.3-13.5):
  move-or-fold by target document, alias creation, projection rebuild.
- `scripts/knowledge-canary.mjs` — the pre-migration writer canary (§15).
```

## claim_6088866c53a017b4a262793cdc176e7e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#194-read-surfaces-and-doctor-checks-9-146, lines 699–699.
Target: docs/platform/proposals/knowledge-registry-redesign.md#194-read-surfaces-and-doctor-checks-9-146.
Source digest: 18fddf6b370334643f9b693869525e35d92e5de8348cf5f328a5772d2f0cfc50
Target digest: 18fddf6b370334643f9b693869525e35d92e5de8348cf5f328a5772d2f0cfc50
Shown source SHA256: e927e190ab9c14780517f1241299b92f1fc30c82d7d951ed9c7657b7863d9699
Shown target SHA256: e927e190ab9c14780517f1241299b92f1fc30c82d7d951ed9c7657b7863d9699

### Proposed decision

```json
{
  "claimId": "claim_6088866c53a017b4a262793cdc176e7e",
  "sourceUnitDigest": "18fddf6b370334643f9b693869525e35d92e5de8348cf5f328a5772d2f0cfc50",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "194-read-surfaces-and-doctor-checks-9-146",
  "targetUnitDigest": "18fddf6b370334643f9b693869525e35d92e5de8348cf5f328a5772d2f0cfc50",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "19. Implementation Pointers"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#194-read-surfaces-and-doctor-checks-9-146 (lines 699–699) is carried at docs/platform/proposals/knowledge-registry-redesign.md#194-read-surfaces-and-doctor-checks-9-146 (lines 723–723); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 19.4 Read Surfaces And Doctor Checks (§9, §14.6)

- `src/report/enduser-index.mjs`, `src/report/enduser-index-generate.mjs` —
  `doc-sources`/`docs-index` read through the resolver (old-path and
  current-path lookup, §9).
- `src/setup/registrations.mjs` — registers the 9 `knowledge-*` doctor
  checks from §14.6 into `fgos doctor`'s check registry.
- `src/state/workflow-stage-graphs.mjs` — retrospective stage now routes to
  the `fgos-coding-knowledge` skill (§12 writer flow) instead of the old
  quadrant-picking path.
- `src/runner/merge.mjs` — merge-time hookup for registry-aware retrospective
  handoff.
```

### Full target shown text

```text
### 19.4 Read Surfaces And Doctor Checks (§9, §14.6)

- `src/report/enduser-index.mjs`, `src/report/enduser-index-generate.mjs` —
  `doc-sources`/`docs-index` read through the resolver (old-path and
  current-path lookup, §9).
- `src/setup/registrations.mjs` — registers the 9 `knowledge-*` doctor
  checks from §14.6 into `fgos doctor`'s check registry.
- `src/state/workflow-stage-graphs.mjs` — retrospective stage now routes to
  the `fgos-coding-knowledge` skill (§12 writer flow) instead of the old
  quadrant-picking path.
- `src/runner/merge.mjs` — merge-time hookup for registry-aware retrospective
  handoff.
```

## claim_08678f424d97373dbec06ac69f4b59f8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-134, lines 701–710.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-137.
Source digest: 157d985b04eb460c6f8029f29a05d170898ca24fa4474c540f8611ab2b80c27e
Target digest: 157d985b04eb460c6f8029f29a05d170898ca24fa4474c540f8611ab2b80c27e
Shown source SHA256: 157d985b04eb460c6f8029f29a05d170898ca24fa4474c540f8611ab2b80c27e
Shown target SHA256: 157d985b04eb460c6f8029f29a05d170898ca24fa4474c540f8611ab2b80c27e

### Proposed decision

```json
{
  "claimId": "claim_08678f424d97373dbec06ac69f4b59f8",
  "sourceUnitDigest": "157d985b04eb460c6f8029f29a05d170898ca24fa4474c540f8611ab2b80c27e",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-137",
  "targetUnitDigest": "157d985b04eb460c6f8029f29a05d170898ca24fa4474c540f8611ab2b80c27e",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "19. Implementation Pointers",
    "19.4 Read Surfaces And Doctor Checks (§9, §14.6)"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-134 (lines 701–710) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-137 (lines 725–734); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- `src/report/enduser-index.mjs`, `src/report/enduser-index-generate.mjs` —
  `doc-sources`/`docs-index` read through the resolver (old-path and
  current-path lookup, §9).
- `src/setup/registrations.mjs` — registers the 9 `knowledge-*` doctor
  checks from §14.6 into `fgos doctor`'s check registry.
- `src/state/workflow-stage-graphs.mjs` — retrospective stage now routes to
  the `fgos-coding-knowledge` skill (§12 writer flow) instead of the old
  quadrant-picking path.
- `src/runner/merge.mjs` — merge-time hookup for registry-aware retrospective
  handoff.
```

### Full target shown text

```text
- `src/report/enduser-index.mjs`, `src/report/enduser-index-generate.mjs` —
  `doc-sources`/`docs-index` read through the resolver (old-path and
  current-path lookup, §9).
- `src/setup/registrations.mjs` — registers the 9 `knowledge-*` doctor
  checks from §14.6 into `fgos doctor`'s check registry.
- `src/state/workflow-stage-graphs.mjs` — retrospective stage now routes to
  the `fgos-coding-knowledge` skill (§12 writer flow) instead of the old
  quadrant-picking path.
- `src/runner/merge.mjs` — merge-time hookup for registry-aware retrospective
  handoff.
```

## claim_1428ba4bfe2329dae599246daed0e338

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#195-skill-and-compatibility, lines 712–712.
Target: docs/platform/proposals/knowledge-registry-redesign.md#195-skill-and-compatibility.
Source digest: b2a708ef1c71aa3bf4270d5341ea503c8d49775abeec04ef2f5433c56999ef34
Target digest: b2a708ef1c71aa3bf4270d5341ea503c8d49775abeec04ef2f5433c56999ef34
Shown source SHA256: 1d71e58b619d838b3238474caa815ccfd045eac5dc7d13d5457c7960613b0982
Shown target SHA256: 1d71e58b619d838b3238474caa815ccfd045eac5dc7d13d5457c7960613b0982

### Proposed decision

```json
{
  "claimId": "claim_1428ba4bfe2329dae599246daed0e338",
  "sourceUnitDigest": "b2a708ef1c71aa3bf4270d5341ea503c8d49775abeec04ef2f5433c56999ef34",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "195-skill-and-compatibility",
  "targetUnitDigest": "b2a708ef1c71aa3bf4270d5341ea503c8d49775abeec04ef2f5433c56999ef34",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "19. Implementation Pointers"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#195-skill-and-compatibility (lines 712–712) is carried at docs/platform/proposals/knowledge-registry-redesign.md#195-skill-and-compatibility (lines 736–736); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 19.5 Skill And Compatibility

- `domains/coding/skills/fgos-coding-knowledge/SKILL.md` — the registry-first
  writer skill (§12), mirrored byte-identical at `.agents/skills/`,
  `.claude/skills/`, and `plugins/fgOS/skills/`.
- `domains/coding/skills/fgos-coding-compounding/SKILL.md` — legacy producer
  skill, updated to route through the same gate (§4's compatibility-alias
  rule), mirrored at the same three locations.
- `CHANGELOG.md`, `docs/architecture-manifest.json` — user-visible change log
  and module registration.
```

### Full target shown text

```text
### 19.5 Skill And Compatibility

- `domains/coding/skills/fgos-coding-knowledge/SKILL.md` — the registry-first
  writer skill (§12), mirrored byte-identical at `.agents/skills/`,
  `.claude/skills/`, and `plugins/fgOS/skills/`.
- `domains/coding/skills/fgos-coding-compounding/SKILL.md` — legacy producer
  skill, updated to route through the same gate (§4's compatibility-alias
  rule), mirrored at the same three locations.
- `CHANGELOG.md`, `docs/architecture-manifest.json` — user-visible change log
  and module registration.
```

## claim_59b6008066ff0633cea7cfd5a835cca3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-135, lines 714–721.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-138.
Source digest: 40a2e8fefd6eaf57957b9072b6984293983a7f1f87cdc9fce8284e671f948b6d
Target digest: 40a2e8fefd6eaf57957b9072b6984293983a7f1f87cdc9fce8284e671f948b6d
Shown source SHA256: 40a2e8fefd6eaf57957b9072b6984293983a7f1f87cdc9fce8284e671f948b6d
Shown target SHA256: 40a2e8fefd6eaf57957b9072b6984293983a7f1f87cdc9fce8284e671f948b6d

### Proposed decision

```json
{
  "claimId": "claim_59b6008066ff0633cea7cfd5a835cca3",
  "sourceUnitDigest": "40a2e8fefd6eaf57957b9072b6984293983a7f1f87cdc9fce8284e671f948b6d",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-138",
  "targetUnitDigest": "40a2e8fefd6eaf57957b9072b6984293983a7f1f87cdc9fce8284e671f948b6d",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "19. Implementation Pointers",
    "19.5 Skill And Compatibility"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-135 (lines 714–721) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-138 (lines 738–745); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- `domains/coding/skills/fgos-coding-knowledge/SKILL.md` — the registry-first
  writer skill (§12), mirrored byte-identical at `.agents/skills/`,
  `.claude/skills/`, and `plugins/fgOS/skills/`.
- `domains/coding/skills/fgos-coding-compounding/SKILL.md` — legacy producer
  skill, updated to route through the same gate (§4's compatibility-alias
  rule), mirrored at the same three locations.
- `CHANGELOG.md`, `docs/architecture-manifest.json` — user-visible change log
  and module registration.
```

### Full target shown text

```text
- `domains/coding/skills/fgos-coding-knowledge/SKILL.md` — the registry-first
  writer skill (§12), mirrored byte-identical at `.agents/skills/`,
  `.claude/skills/`, and `plugins/fgOS/skills/`.
- `domains/coding/skills/fgos-coding-compounding/SKILL.md` — legacy producer
  skill, updated to route through the same gate (§4's compatibility-alias
  rule), mirrored at the same three locations.
- `CHANGELOG.md`, `docs/architecture-manifest.json` — user-visible change log
  and module registration.
```

## claim_fdf11b9d1d78cdd00ddfded9b26c8252

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/knowledge-registry-redesign.md#196-focused-tests, lines 723–723.
Target: docs/platform/proposals/knowledge-registry-redesign.md#196-focused-tests.
Source digest: 74650482ff180cc98875fc3619286a0db9b652acf6a9819ccbbd7d02a25585c8
Target digest: 74650482ff180cc98875fc3619286a0db9b652acf6a9819ccbbd7d02a25585c8
Shown source SHA256: d1218e34cae8461fc5c4b3ad03f990feb480d4e5e7fb668c779c9ea310638cab
Shown target SHA256: d1218e34cae8461fc5c4b3ad03f990feb480d4e5e7fb668c779c9ea310638cab

### Proposed decision

```json
{
  "claimId": "claim_fdf11b9d1d78cdd00ddfded9b26c8252",
  "sourceUnitDigest": "74650482ff180cc98875fc3619286a0db9b652acf6a9819ccbbd7d02a25585c8",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "196-focused-tests",
  "targetUnitDigest": "74650482ff180cc98875fc3619286a0db9b652acf6a9819ccbbd7d02a25585c8",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "19. Implementation Pointers"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source heading docs/architect/knowledge-registry-redesign.md#196-focused-tests (lines 723–723) is carried at docs/platform/proposals/knowledge-registry-redesign.md#196-focused-tests (lines 747–747); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 19.6 Focused Tests

- `test/state/knowledge-registry.test.mjs`, `test/state/knowledge-bootstrap.test.mjs`
  — reducer/invariant harness (§14.1) and bootstrap idempotency.
- `test/report/knowledge-resolver.test.mjs` — resolver harness (§14.4).
- `test/cli/knowledge-verbs.test.mjs`, `test/cli/knowledge-attest-gate.test.mjs`,
  `test/cli/knowledge-deprecation.test.mjs` — CLI harness (§14.2) and producer
  gate harness (§14.3).
- `test/scripts/knowledge-classifier.test.mjs`, `test/scripts/knowledge-migration.test.mjs`
  — migration harness (§14.5).
- `test/setup/knowledge-doctor.test.mjs` — doctor-check harness (§14.6).
- `test/skills/fgos-coding-knowledge.test.mjs`, `test/skills/knowledge-canary.test.mjs`
  — writer-skill and canary coverage (§12, §15).
- Incidental fixture updates (not new behavior of their own):
  `test/e2e/fixture-marketing-domain.test.mjs`, `test/report/enduser-index.test.mjs`,
  `test/runner/merge.test.mjs`, `test/state/workflow-stage-graphs.test.mjs`,
  `test/setup/checks.test.mjs`.

Decision/history anchors: `docs/history/compound-learn-artifact-registry/`
(DISCUSSION.md, RESEARCH.md), plus each `tsk-28x-*`/`tsk-3uc` item's own
`docs/history/<slug>/plan.md` and `iron-law-evidence.md`.
```

### Full target shown text

```text
### 19.6 Focused Tests

- `test/state/knowledge-registry.test.mjs`, `test/state/knowledge-bootstrap.test.mjs`
  — reducer/invariant harness (§14.1) and bootstrap idempotency.
- `test/report/knowledge-resolver.test.mjs` — resolver harness (§14.4).
- `test/cli/knowledge-verbs.test.mjs`, `test/cli/knowledge-attest-gate.test.mjs`,
  `test/cli/knowledge-deprecation.test.mjs` — CLI harness (§14.2) and producer
  gate harness (§14.3).
- `test/scripts/knowledge-classifier.test.mjs`, `test/scripts/knowledge-migration.test.mjs`
  — migration harness (§14.5).
- `test/setup/knowledge-doctor.test.mjs` — doctor-check harness (§14.6).
- `test/skills/fgos-coding-knowledge.test.mjs`, `test/skills/knowledge-canary.test.mjs`
  — writer-skill and canary coverage (§12, §15).
- Incidental fixture updates (not new behavior of their own):
  `test/e2e/fixture-marketing-domain.test.mjs`, `test/report/enduser-index.test.mjs`,
  `test/runner/merge.test.mjs`, `test/state/workflow-stage-graphs.test.mjs`,
  `test/setup/checks.test.mjs`.

Decision/history anchors: `docs/history/compound-learn-artifact-registry/`
(DISCUSSION.md, RESEARCH.md), plus each `tsk-28x-*`/`tsk-3uc` item's own
`docs/history/<slug>/plan.md` and `iron-law-evidence.md`.
```

## claim_235c802289867d786d928ed580c1b52a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-136, lines 725–739.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-139.
Source digest: d483c4ed31ddf0aa6fc65d71839dfe58b62143f5211aa736c978442d3f3d7326
Target digest: d483c4ed31ddf0aa6fc65d71839dfe58b62143f5211aa736c978442d3f3d7326
Shown source SHA256: d483c4ed31ddf0aa6fc65d71839dfe58b62143f5211aa736c978442d3f3d7326
Shown target SHA256: d483c4ed31ddf0aa6fc65d71839dfe58b62143f5211aa736c978442d3f3d7326

### Proposed decision

```json
{
  "claimId": "claim_235c802289867d786d928ed580c1b52a",
  "sourceUnitDigest": "d483c4ed31ddf0aa6fc65d71839dfe58b62143f5211aa736c978442d3f3d7326",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-139",
  "targetUnitDigest": "d483c4ed31ddf0aa6fc65d71839dfe58b62143f5211aa736c978442d3f3d7326",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "19. Implementation Pointers",
    "19.6 Focused Tests"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-136 (lines 725–739) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-139 (lines 749–763); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- `test/state/knowledge-registry.test.mjs`, `test/state/knowledge-bootstrap.test.mjs`
  — reducer/invariant harness (§14.1) and bootstrap idempotency.
- `test/report/knowledge-resolver.test.mjs` — resolver harness (§14.4).
- `test/cli/knowledge-verbs.test.mjs`, `test/cli/knowledge-attest-gate.test.mjs`,
  `test/cli/knowledge-deprecation.test.mjs` — CLI harness (§14.2) and producer
  gate harness (§14.3).
- `test/scripts/knowledge-classifier.test.mjs`, `test/scripts/knowledge-migration.test.mjs`
  — migration harness (§14.5).
- `test/setup/knowledge-doctor.test.mjs` — doctor-check harness (§14.6).
- `test/skills/fgos-coding-knowledge.test.mjs`, `test/skills/knowledge-canary.test.mjs`
  — writer-skill and canary coverage (§12, §15).
- Incidental fixture updates (not new behavior of their own):
  `test/e2e/fixture-marketing-domain.test.mjs`, `test/report/enduser-index.test.mjs`,
  `test/runner/merge.test.mjs`, `test/state/workflow-stage-graphs.test.mjs`,
  `test/setup/checks.test.mjs`.
```

### Full target shown text

```text
- `test/state/knowledge-registry.test.mjs`, `test/state/knowledge-bootstrap.test.mjs`
  — reducer/invariant harness (§14.1) and bootstrap idempotency.
- `test/report/knowledge-resolver.test.mjs` — resolver harness (§14.4).
- `test/cli/knowledge-verbs.test.mjs`, `test/cli/knowledge-attest-gate.test.mjs`,
  `test/cli/knowledge-deprecation.test.mjs` — CLI harness (§14.2) and producer
  gate harness (§14.3).
- `test/scripts/knowledge-classifier.test.mjs`, `test/scripts/knowledge-migration.test.mjs`
  — migration harness (§14.5).
- `test/setup/knowledge-doctor.test.mjs` — doctor-check harness (§14.6).
- `test/skills/fgos-coding-knowledge.test.mjs`, `test/skills/knowledge-canary.test.mjs`
  — writer-skill and canary coverage (§12, §15).
- Incidental fixture updates (not new behavior of their own):
  `test/e2e/fixture-marketing-domain.test.mjs`, `test/report/enduser-index.test.mjs`,
  `test/runner/merge.test.mjs`, `test/state/workflow-stage-graphs.test.mjs`,
  `test/setup/checks.test.mjs`.
```

## claim_85632efbbeec285b3337c7ab7c357d7f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/knowledge-registry-redesign.md#unheaded-block-137, lines 741–743.
Target: docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-140.
Source digest: f5279d34540f73e93c659be2f0f7f7aab73cc2697a8f39b060b437e590e2bce4
Target digest: f5279d34540f73e93c659be2f0f7f7aab73cc2697a8f39b060b437e590e2bce4
Shown source SHA256: f5279d34540f73e93c659be2f0f7f7aab73cc2697a8f39b060b437e590e2bce4
Shown target SHA256: f5279d34540f73e93c659be2f0f7f7aab73cc2697a8f39b060b437e590e2bce4

### Proposed decision

```json
{
  "claimId": "claim_85632efbbeec285b3337c7ab7c357d7f",
  "sourceUnitDigest": "f5279d34540f73e93c659be2f0f7f7aab73cc2697a8f39b060b437e590e2bce4",
  "targetOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
  "targetAnchor": "unheaded-block-140",
  "targetUnitDigest": "f5279d34540f73e93c659be2f0f7f7aab73cc2697a8f39b060b437e590e2bce4",
  "targetAncestry": [
    "Knowledge Registry Redesign",
    "19. Implementation Pointers",
    "19.6 Focused Tests"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain map proposal kind: implementation alone does not promote a design. Full truth remains owed at promotion. Evidence: src/state/knowledge-registry.mjs:20,88,211,537,646,733–748 and bin/fgos.mjs:1701,1767 explicitly cite the source. domains/coding/skills/fgos-coding-knowledge/SKILL.md:44 is an additional canonical skill-source consumer; setup registrations:3977,4001,4035 remain. Complete source unheaded-block docs/architect/knowledge-registry-redesign.md#unheaded-block-137 (lines 741–743) is carried at docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-140 (lines 765–767); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Decision/history anchors: `docs/history/compound-learn-artifact-registry/`
(DISCUSSION.md, RESEARCH.md), plus each `tsk-28x-*`/`tsk-3uc` item's own
`docs/history/<slug>/plan.md` and `iron-law-evidence.md`.
```

### Full target shown text

```text
Decision/history anchors: `docs/history/compound-learn-artifact-registry/`
(DISCUSSION.md, RESEARCH.md), plus each `tsk-28x-*`/`tsk-3uc` item's own
`docs/history/<slug>/plan.md` and `iron-law-evidence.md`.
```
