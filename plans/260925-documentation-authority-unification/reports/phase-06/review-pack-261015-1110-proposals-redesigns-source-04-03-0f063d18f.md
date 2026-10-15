# Bounded proposals and redesigns review pack

Content commit: 0f063d18fdab01cb6f2c915bb60ff528c5e0f238
Original shard: plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-04-doing-coordination-redesign.json
Original shard SHA256: 2e1f828a0423d70d3f99393b1129e8acd25528e423eacca3de1f53b69f8042f6
Source file: docs/architect/doing-coordination-redesign.md
Part 3/3; entries: **73**. Source-file group 4/20.
Author session: codex-session:unit-run-1792034226117-40d90d09@2026-10-15
Row-level authoredBy is authoritative for mixed correction authors. Independent ordinary review only; all rows remain pending.

A36 differing-digest rows (0): none.

Absent-target rows (0): none.

Rows changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238 (0): none.

Weak-exact/Judgment population: 21; reviewer chooses and records seed and IDs for at least 10 deep reads (15%, minimum 10, all if fewer), plus every differing/absent pair. Mechanically verify all rows, full digests, anchors, ancestry, source eligibility, one owner and exact-proof thresholds. A36 supersedes the older 100% Weak-exact/Judgment deep-read rule in review-brief; retain its other ordinary-review obligations. If >3% deep rework, deep-read the whole pack. Mark each own note deep or mechanical. No author-selected draw or seed/key is supplied. Complete batch: 1,815 rows, 1,289 Unit-exact / 438 Weak-exact / 88 Judgment; 88 mandatory differing pairs; 114 correction rows.

Return an independent committed report with Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and this five-column table. Consolidate all parts for each original shard before unchanged ordinary application; these slices do not change shard bytes. Use ok/rework/hold with an own note and the full shown-unit digest (literal none for an absent target). Reverse eligibility and triage findings have separate requests and cannot approve these source rows.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

## Native gate blocker at the content pin

D reports eight decision-loss-without-partial-carry findings in the proposals README rationales (the phrase `it omits later siblings` describes the source index). The checker and decision content are unchanged. These are reported blockers, not waived findings. This pack contains 0 affected rows.

```json
[]
```

## claim_e8d83428e2818c5957539bd1b35832fc

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-120, lines 712–712.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-123.
Source digest: d0ed5a46fc6ce4db6bada10762ca7fcae2c032017bb85049ad343a4341ea9547
Target digest: d0ed5a46fc6ce4db6bada10762ca7fcae2c032017bb85049ad343a4341ea9547
Shown source SHA256: d0ed5a46fc6ce4db6bada10762ca7fcae2c032017bb85049ad343a4341ea9547
Shown target SHA256: d0ed5a46fc6ce4db6bada10762ca7fcae2c032017bb85049ad343a4341ea9547

### Proposed decision

```json
{
  "claimId": "claim_e8d83428e2818c5957539bd1b35832fc",
  "sourceUnitDigest": "d0ed5a46fc6ce4db6bada10762ca7fcae2c032017bb85049ad343a4341ea9547",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-123",
  "targetUnitDigest": "d0ed5a46fc6ce4db6bada10762ca7fcae2c032017bb85049ad343a4341ea9547",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "12. Scheduling And Query Rules",
    "12.1 Frontier"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-120 (lines 712–712) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-123 (lines 736–736); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
If an item is durable `todo` but has an active claim, frontier must treat it as `doing`, open, and unavailable for another claim.
```

### Full target shown text

```text
If an item is durable `todo` but has an active claim, frontier must treat it as `doing`, open, and unavailable for another claim.
```

## claim_3dc8db44579247ab1ac372f571ec8c92

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-121, lines 714–714.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-124.
Source digest: 06f4a770828e934b5b33f3f9cf4c79279efd1f9f7124d193c1fb4e597af8a891
Target digest: 06f4a770828e934b5b33f3f9cf4c79279efd1f9f7124d193c1fb4e597af8a891
Shown source SHA256: 06f4a770828e934b5b33f3f9cf4c79279efd1f9f7124d193c1fb4e597af8a891
Shown target SHA256: 06f4a770828e934b5b33f3f9cf4c79279efd1f9f7124d193c1fb4e597af8a891

### Proposed decision

```json
{
  "claimId": "claim_3dc8db44579247ab1ac372f571ec8c92",
  "sourceUnitDigest": "06f4a770828e934b5b33f3f9cf4c79279efd1f9f7124d193c1fb4e597af8a891",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-124",
  "targetUnitDigest": "06f4a770828e934b5b33f3f9cf4c79279efd1f9f7124d193c1fb4e597af8a891",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "12. Scheduling And Query Rules",
    "12.1 Frontier"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-121 (lines 714–714) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-124 (lines 738–738); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Dependency resolution should still use durable finality:
```

### Full target shown text

```text
Dependency resolution should still use durable finality:
```

## claim_83b18060e9cab510be01616a4e347354

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-122, lines 716–719.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-125.
Source digest: 4d8a1bebbbd0048a23e8a1fdd2f2aeff6b66444b1e18e13a8c092cc0bb7ca499
Target digest: 4d8a1bebbbd0048a23e8a1fdd2f2aeff6b66444b1e18e13a8c092cc0bb7ca499
Shown source SHA256: 4d8a1bebbbd0048a23e8a1fdd2f2aeff6b66444b1e18e13a8c092cc0bb7ca499
Shown target SHA256: 4d8a1bebbbd0048a23e8a1fdd2f2aeff6b66444b1e18e13a8c092cc0bb7ca499

### Proposed decision

```json
{
  "claimId": "claim_83b18060e9cab510be01616a4e347354",
  "sourceUnitDigest": "4d8a1bebbbd0048a23e8a1fdd2f2aeff6b66444b1e18e13a8c092cc0bb7ca499",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-125",
  "targetUnitDigest": "4d8a1bebbbd0048a23e8a1fdd2f2aeff6b66444b1e18e13a8c092cc0bb7ca499",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "12. Scheduling And Query Rules",
    "12.1 Frontier"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-122 (lines 716–719) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-125 (lines 740–743); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- final/delivered statuses satisfy dependencies;
- parked statuses do not satisfy dependencies unless existing policy explicitly says otherwise;
- effective `doing` is open and unresolved;
- claimable `todo` is open and available only when no active claim exists.
```

### Full target shown text

```text
- final/delivered statuses satisfy dependencies;
- parked statuses do not satisfy dependencies unless existing policy explicitly says otherwise;
- effective `doing` is open and unresolved;
- claimable `todo` is open and available only when no active claim exists.
```

## claim_e415e4d2269ddf7a1c1f6a4f7c4d31ad

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#122-worker-slots, lines 721–721.
Target: docs/platform/proposals/doing-coordination-redesign.md#122-worker-slots.
Source digest: 901e87027418758a087825efb6f5f8aa491d2ee4976992e69428d5bce47d940d
Target digest: 901e87027418758a087825efb6f5f8aa491d2ee4976992e69428d5bce47d940d
Shown source SHA256: 90a95a0d275db2fe039f0098f9785f3c2aac3dffdbcf5d5270151fe93473a045
Shown target SHA256: 90a95a0d275db2fe039f0098f9785f3c2aac3dffdbcf5d5270151fe93473a045

### Proposed decision

```json
{
  "claimId": "claim_e415e4d2269ddf7a1c1f6a4f7c4d31ad",
  "sourceUnitDigest": "901e87027418758a087825efb6f5f8aa491d2ee4976992e69428d5bce47d940d",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "122-worker-slots",
  "targetUnitDigest": "901e87027418758a087825efb6f5f8aa491d2ee4976992e69428d5bce47d940d",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "12. Scheduling And Query Rules"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#122-worker-slots (lines 721–721) is carried at docs/platform/proposals/doing-coordination-redesign.md#122-worker-slots (lines 745–745); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 12.2 Worker Slots

Worker-slot calculation must count active runtime claims, not durable `doing` events.

Slots should reflect:

- currently active claims;
- reclaim eligibility;
- role/agent ownership;
- phase/stage where applicable.
```

### Full target shown text

```text
### 12.2 Worker Slots

Worker-slot calculation must count active runtime claims, not durable `doing` events.

Slots should reflect:

- currently active claims;
- reclaim eligibility;
- role/agent ownership;
- phase/stage where applicable.
```

## claim_526278365b37678e56ac6351cb7fdc40

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-123, lines 723–723.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-126.
Source digest: 117a04ffc47940dc38768a57d5624f662bdd8d6a8353f6a93f4b9a0f9359bbcd
Target digest: 117a04ffc47940dc38768a57d5624f662bdd8d6a8353f6a93f4b9a0f9359bbcd
Shown source SHA256: 117a04ffc47940dc38768a57d5624f662bdd8d6a8353f6a93f4b9a0f9359bbcd
Shown target SHA256: 117a04ffc47940dc38768a57d5624f662bdd8d6a8353f6a93f4b9a0f9359bbcd

### Proposed decision

```json
{
  "claimId": "claim_526278365b37678e56ac6351cb7fdc40",
  "sourceUnitDigest": "117a04ffc47940dc38768a57d5624f662bdd8d6a8353f6a93f4b9a0f9359bbcd",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-126",
  "targetUnitDigest": "117a04ffc47940dc38768a57d5624f662bdd8d6a8353f6a93f4b9a0f9359bbcd",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "12. Scheduling And Query Rules",
    "12.2 Worker Slots"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-123 (lines 723–723) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-126 (lines 747–747); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Worker-slot calculation must count active runtime claims, not durable `doing` events.
```

### Full target shown text

```text
Worker-slot calculation must count active runtime claims, not durable `doing` events.
```

## claim_764914b3785e912f65dea18cc9e0f35a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-124, lines 725–730.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-127.
Source digest: f6545ff42c66ccf8c5af52fde16923bf8574b429db1640d92bdb91fec4dda9bc
Target digest: f6545ff42c66ccf8c5af52fde16923bf8574b429db1640d92bdb91fec4dda9bc
Shown source SHA256: f6545ff42c66ccf8c5af52fde16923bf8574b429db1640d92bdb91fec4dda9bc
Shown target SHA256: f6545ff42c66ccf8c5af52fde16923bf8574b429db1640d92bdb91fec4dda9bc

### Proposed decision

```json
{
  "claimId": "claim_764914b3785e912f65dea18cc9e0f35a",
  "sourceUnitDigest": "f6545ff42c66ccf8c5af52fde16923bf8574b429db1640d92bdb91fec4dda9bc",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-127",
  "targetUnitDigest": "f6545ff42c66ccf8c5af52fde16923bf8574b429db1640d92bdb91fec4dda9bc",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "12. Scheduling And Query Rules",
    "12.2 Worker Slots"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-124 (lines 725–730) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-127 (lines 749–754); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Slots should reflect:

- currently active claims;
- reclaim eligibility;
- role/agent ownership;
- phase/stage where applicable.
```

### Full target shown text

```text
Slots should reflect:

- currently active claims;
- reclaim eligibility;
- role/agent ownership;
- phase/stage where applicable.
```

## claim_4f2cc4e89671abe45c7cdd590dd69716

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#123-list-and-query, lines 732–732.
Target: docs/platform/proposals/doing-coordination-redesign.md#123-list-and-query.
Source digest: d564b5983329b3f653880563a88cd616b0cf3057674ad493a9d03461703f5a5a
Target digest: d564b5983329b3f653880563a88cd616b0cf3057674ad493a9d03461703f5a5a
Shown source SHA256: 6b8afd41d11057bf479624dd8b2969046c1db9ef99528b6654b46a3a34204bee
Shown target SHA256: 6b8afd41d11057bf479624dd8b2969046c1db9ef99528b6654b46a3a34204bee

### Proposed decision

```json
{
  "claimId": "claim_4f2cc4e89671abe45c7cdd590dd69716",
  "sourceUnitDigest": "d564b5983329b3f653880563a88cd616b0cf3057674ad493a9d03461703f5a5a",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "123-list-and-query",
  "targetUnitDigest": "d564b5983329b3f653880563a88cd616b0cf3057674ad493a9d03461703f5a5a",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "12. Scheduling And Query Rules"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#123-list-and-query (lines 732–732) is carried at docs/platform/proposals/doing-coordination-redesign.md#123-list-and-query (lines 756–756); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 12.3 List And Query

All user-facing status filters must be explicit about view choice:

- default status queries should use effective status;
- durable-only queries should be named as such for debugging/audit;
- `list --status doing` must return items with active runtime claims;
- `list --status todo` must not include active-claimed items unless the command explicitly asks for durable-only status.
```

### Full target shown text

```text
### 12.3 List And Query

All user-facing status filters must be explicit about view choice:

- default status queries should use effective status;
- durable-only queries should be named as such for debugging/audit;
- `list --status doing` must return items with active runtime claims;
- `list --status todo` must not include active-claimed items unless the command explicitly asks for durable-only status.
```

## claim_7d42ec783ae5c2989d6ed4ed1c28c523

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-125, lines 734–734.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-128.
Source digest: a8d3b7a6a80afb716c4ede15d66bbbd74b25b59416dbe8fdad3ae36c5c9f9242
Target digest: a8d3b7a6a80afb716c4ede15d66bbbd74b25b59416dbe8fdad3ae36c5c9f9242
Shown source SHA256: a8d3b7a6a80afb716c4ede15d66bbbd74b25b59416dbe8fdad3ae36c5c9f9242
Shown target SHA256: a8d3b7a6a80afb716c4ede15d66bbbd74b25b59416dbe8fdad3ae36c5c9f9242

### Proposed decision

```json
{
  "claimId": "claim_7d42ec783ae5c2989d6ed4ed1c28c523",
  "sourceUnitDigest": "a8d3b7a6a80afb716c4ede15d66bbbd74b25b59416dbe8fdad3ae36c5c9f9242",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-128",
  "targetUnitDigest": "a8d3b7a6a80afb716c4ede15d66bbbd74b25b59416dbe8fdad3ae36c5c9f9242",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "12. Scheduling And Query Rules",
    "12.3 List And Query"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-125 (lines 734–734) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-128 (lines 758–758); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
All user-facing status filters must be explicit about view choice:
```

### Full target shown text

```text
All user-facing status filters must be explicit about view choice:
```

## claim_53e88d27d5a2776524897ae49aa5c034

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-126, lines 736–739.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-129.
Source digest: 1d1db5666a6350bc259a4ff1121185600b8e43abcdd38bd2e2c30d40b779877a
Target digest: 1d1db5666a6350bc259a4ff1121185600b8e43abcdd38bd2e2c30d40b779877a
Shown source SHA256: 1d1db5666a6350bc259a4ff1121185600b8e43abcdd38bd2e2c30d40b779877a
Shown target SHA256: 1d1db5666a6350bc259a4ff1121185600b8e43abcdd38bd2e2c30d40b779877a

### Proposed decision

```json
{
  "claimId": "claim_53e88d27d5a2776524897ae49aa5c034",
  "sourceUnitDigest": "1d1db5666a6350bc259a4ff1121185600b8e43abcdd38bd2e2c30d40b779877a",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-129",
  "targetUnitDigest": "1d1db5666a6350bc259a4ff1121185600b8e43abcdd38bd2e2c30d40b779877a",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "12. Scheduling And Query Rules",
    "12.3 List And Query"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-126 (lines 736–739) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-129 (lines 760–763); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- default status queries should use effective status;
- durable-only queries should be named as such for debugging/audit;
- `list --status doing` must return items with active runtime claims;
- `list --status todo` must not include active-claimed items unless the command explicitly asks for durable-only status.
```

### Full target shown text

```text
- default status queries should use effective status;
- durable-only queries should be named as such for debugging/audit;
- `list --status doing` must return items with active runtime claims;
- `list --status todo` must not include active-claimed items unless the command explicitly asks for durable-only status.
```

## claim_cdbb218d7771aa497c79f5df8c01a5e7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#13-anti-loop-rules, lines 741–741.
Target: docs/platform/proposals/doing-coordination-redesign.md#13-anti-loop-rules.
Source digest: c072c8a1d234fad37baae023ec5d85ea6fc5bdc653df649be11617ae22d07d14
Target digest: c072c8a1d234fad37baae023ec5d85ea6fc5bdc653df649be11617ae22d07d14
Shown source SHA256: ffc87b3a846706e75275c53981a5d70994337d58d9a0366b93dc3de3ce63b795
Shown target SHA256: ffc87b3a846706e75275c53981a5d70994337d58d9a0366b93dc3de3ce63b795

### Proposed decision

```json
{
  "claimId": "claim_cdbb218d7771aa497c79f5df8c01a5e7",
  "sourceUnitDigest": "c072c8a1d234fad37baae023ec5d85ea6fc5bdc653df649be11617ae22d07d14",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "13-anti-loop-rules",
  "targetUnitDigest": "c072c8a1d234fad37baae023ec5d85ea6fc5bdc653df649be11617ae22d07d14",
  "targetAncestry": [
    "Doing Coordination Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#13-anti-loop-rules (lines 741–741) is carried at docs/platform/proposals/doing-coordination-redesign.md#13-anti-loop-rules (lines 765–765); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
## 13. Anti-Loop Rules

Anti-loop must count durable attempt history, not active runtime claim files.

Old behavior:

```txt
count work.move events where to == "doing" and stage == Execute
```

New behavior:

```txt
count work.attempt events where phase == "execute"
```

The counter must not count clarify/planning/decompose claims unless those represent true execution attempts by product policy.

Human reset events should continue to reset the counted window if that is current policy.
````

### Full target shown text

````text
## 13. Anti-Loop Rules

Anti-loop must count durable attempt history, not active runtime claim files.

Old behavior:

```txt
count work.move events where to == "doing" and stage == Execute
```

New behavior:

```txt
count work.attempt events where phase == "execute"
```

The counter must not count clarify/planning/decompose claims unless those represent true execution attempts by product policy.

Human reset events should continue to reset the counted window if that is current policy.
````

## claim_b90785ac30caf59f7e645b6b19010605

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-127, lines 743–743.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-130.
Source digest: 23d1c2bf13f7ca14704580387219d02d722f1da272c77a7077b31e941ca9f018
Target digest: 23d1c2bf13f7ca14704580387219d02d722f1da272c77a7077b31e941ca9f018
Shown source SHA256: 23d1c2bf13f7ca14704580387219d02d722f1da272c77a7077b31e941ca9f018
Shown target SHA256: 23d1c2bf13f7ca14704580387219d02d722f1da272c77a7077b31e941ca9f018

### Proposed decision

```json
{
  "claimId": "claim_b90785ac30caf59f7e645b6b19010605",
  "sourceUnitDigest": "23d1c2bf13f7ca14704580387219d02d722f1da272c77a7077b31e941ca9f018",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-130",
  "targetUnitDigest": "23d1c2bf13f7ca14704580387219d02d722f1da272c77a7077b31e941ca9f018",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "13. Anti-Loop Rules"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-127 (lines 743–743) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-130 (lines 767–767); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Anti-loop must count durable attempt history, not active runtime claim files.
```

### Full target shown text

```text
Anti-loop must count durable attempt history, not active runtime claim files.
```

## claim_594167d1b904cb4dd6aa4988b558422d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-128, lines 745–749.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-131.
Source digest: d421ed3843bc84e4624fa806dd983e9337a6558f152b816e6d6c10bb6e461b2d
Target digest: d421ed3843bc84e4624fa806dd983e9337a6558f152b816e6d6c10bb6e461b2d
Shown source SHA256: d421ed3843bc84e4624fa806dd983e9337a6558f152b816e6d6c10bb6e461b2d
Shown target SHA256: d421ed3843bc84e4624fa806dd983e9337a6558f152b816e6d6c10bb6e461b2d

### Proposed decision

```json
{
  "claimId": "claim_594167d1b904cb4dd6aa4988b558422d",
  "sourceUnitDigest": "d421ed3843bc84e4624fa806dd983e9337a6558f152b816e6d6c10bb6e461b2d",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-131",
  "targetUnitDigest": "d421ed3843bc84e4624fa806dd983e9337a6558f152b816e6d6c10bb6e461b2d",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "13. Anti-Loop Rules"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-128 (lines 745–749) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-131 (lines 769–773); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
Old behavior:

```txt
count work.move events where to == "doing" and stage == Execute
```
````

### Full target shown text

````text
Old behavior:

```txt
count work.move events where to == "doing" and stage == Execute
```
````

## claim_68b2035c2b5b948479a176031635c7e9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-129, lines 751–755.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-132.
Source digest: 53dc8ed2101bdee18c05b8f37c3a7d07b8d96752b84411fbd9a4a77d64465b6c
Target digest: 53dc8ed2101bdee18c05b8f37c3a7d07b8d96752b84411fbd9a4a77d64465b6c
Shown source SHA256: 53dc8ed2101bdee18c05b8f37c3a7d07b8d96752b84411fbd9a4a77d64465b6c
Shown target SHA256: 53dc8ed2101bdee18c05b8f37c3a7d07b8d96752b84411fbd9a4a77d64465b6c

### Proposed decision

```json
{
  "claimId": "claim_68b2035c2b5b948479a176031635c7e9",
  "sourceUnitDigest": "53dc8ed2101bdee18c05b8f37c3a7d07b8d96752b84411fbd9a4a77d64465b6c",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-132",
  "targetUnitDigest": "53dc8ed2101bdee18c05b8f37c3a7d07b8d96752b84411fbd9a4a77d64465b6c",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "13. Anti-Loop Rules"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-129 (lines 751–755) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-132 (lines 775–779); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
New behavior:

```txt
count work.attempt events where phase == "execute"
```
````

### Full target shown text

````text
New behavior:

```txt
count work.attempt events where phase == "execute"
```
````

## claim_57f5820243a409e6a140404c0f517672

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-130, lines 757–757.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-133.
Source digest: a01cdb79c1dfef3ba98727379b2cee167884195aa99067825da9a619de578371
Target digest: a01cdb79c1dfef3ba98727379b2cee167884195aa99067825da9a619de578371
Shown source SHA256: a01cdb79c1dfef3ba98727379b2cee167884195aa99067825da9a619de578371
Shown target SHA256: a01cdb79c1dfef3ba98727379b2cee167884195aa99067825da9a619de578371

### Proposed decision

```json
{
  "claimId": "claim_57f5820243a409e6a140404c0f517672",
  "sourceUnitDigest": "a01cdb79c1dfef3ba98727379b2cee167884195aa99067825da9a619de578371",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-133",
  "targetUnitDigest": "a01cdb79c1dfef3ba98727379b2cee167884195aa99067825da9a619de578371",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "13. Anti-Loop Rules"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-130 (lines 757–757) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-133 (lines 781–781); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The counter must not count clarify/planning/decompose claims unless those represent true execution attempts by product policy.
```

### Full target shown text

```text
The counter must not count clarify/planning/decompose claims unless those represent true execution attempts by product policy.
```

## claim_2cc7437f2cc96d723142db71e073c865

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-131, lines 759–759.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-134.
Source digest: ea0a32d7a2e889c7194192903c54f8917ba31e98e03042f46dcf967499151d70
Target digest: ea0a32d7a2e889c7194192903c54f8917ba31e98e03042f46dcf967499151d70
Shown source SHA256: ea0a32d7a2e889c7194192903c54f8917ba31e98e03042f46dcf967499151d70
Shown target SHA256: ea0a32d7a2e889c7194192903c54f8917ba31e98e03042f46dcf967499151d70

### Proposed decision

```json
{
  "claimId": "claim_2cc7437f2cc96d723142db71e073c865",
  "sourceUnitDigest": "ea0a32d7a2e889c7194192903c54f8917ba31e98e03042f46dcf967499151d70",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-134",
  "targetUnitDigest": "ea0a32d7a2e889c7194192903c54f8917ba31e98e03042f46dcf967499151d70",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "13. Anti-Loop Rules"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-131 (lines 759–759) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-134 (lines 783–783); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Human reset events should continue to reset the counted window if that is current policy.
```

### Full target shown text

```text
Human reset events should continue to reset the counted window if that is current policy.
```

## claim_ba3cb966711904f0ed6206e52f5e03b6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#14-migration-strategy, lines 761–761.
Target: docs/platform/proposals/doing-coordination-redesign.md#14-migration-strategy.
Source digest: 160ab5ae5169da32d3959badf2e5954ab0a8f87807877239a05bfe508fa9c2ab
Target digest: 160ab5ae5169da32d3959badf2e5954ab0a8f87807877239a05bfe508fa9c2ab
Shown source SHA256: 3fe866c85886301089e57878c9998c65a6c453573bd700c6e5aacbc223a1c9e9
Shown target SHA256: 3fe866c85886301089e57878c9998c65a6c453573bd700c6e5aacbc223a1c9e9

### Proposed decision

```json
{
  "claimId": "claim_ba3cb966711904f0ed6206e52f5e03b6",
  "sourceUnitDigest": "160ab5ae5169da32d3959badf2e5954ab0a8f87807877239a05bfe508fa9c2ab",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "14-migration-strategy",
  "targetUnitDigest": "160ab5ae5169da32d3959badf2e5954ab0a8f87807877239a05bfe508fa9c2ab",
  "targetAncestry": [
    "Doing Coordination Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#14-migration-strategy (lines 761–761) is carried at docs/platform/proposals/doing-coordination-redesign.md#14-migration-strategy (lines 785–785); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 14. Migration Strategy

This is a hard-cut migration. Downtime is acceptable.

Recommended steps:

1. Stop runners and user claim flows.
2. Ensure durable event logs are committed or otherwise safely backed up.
3. Introduce runtime coordination storage and ignore rules.
4. Introduce attempt events and replay projection.
5. Introduce effective view.
6. Change claim acquire to runtime-only.
7. Change settle/release/reject/verify-fail to validate runtime claim plus durable pre-claim revision.
8. Change frontier, list, query, worker-slot, stale reclaim, and dashboards to effective view.
9. Change anti-loop to attempt history.
10. Retire `releaseClaimOnExecuting`.
11. Run migration over existing durable `doing` events:
    - convert active durable `doing` items either into runtime claims if there is a live valid owner, or into durable attempt records with `released`, `reclaimed`, or `abandoned`;
    - leave no item stranded in durable current status `doing`;
    - recompute `attemptCount`, `lastAttempt`, and item revisions.
12. Run full verification before allowing new claims.

After migration, durable current `doing` should not remain as a normal live state.
```

### Full target shown text

```text
## 14. Migration Strategy

This is a hard-cut migration. Downtime is acceptable.

Recommended steps:

1. Stop runners and user claim flows.
2. Ensure durable event logs are committed or otherwise safely backed up.
3. Introduce runtime coordination storage and ignore rules.
4. Introduce attempt events and replay projection.
5. Introduce effective view.
6. Change claim acquire to runtime-only.
7. Change settle/release/reject/verify-fail to validate runtime claim plus durable pre-claim revision.
8. Change frontier, list, query, worker-slot, stale reclaim, and dashboards to effective view.
9. Change anti-loop to attempt history.
10. Retire `releaseClaimOnExecuting`.
11. Run migration over existing durable `doing` events:
    - convert active durable `doing` items either into runtime claims if there is a live valid owner, or into durable attempt records with `released`, `reclaimed`, or `abandoned`;
    - leave no item stranded in durable current status `doing`;
    - recompute `attemptCount`, `lastAttempt`, and item revisions.
12. Run full verification before allowing new claims.

After migration, durable current `doing` should not remain as a normal live state.
```

## claim_6db587e2ef915e1712ab70cda121dde4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-132, lines 763–763.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-135.
Source digest: b5b2bfa161ed04e7fe26a5993754371f0ebe8ee7a150784db2d31cce8d2b8d87
Target digest: b5b2bfa161ed04e7fe26a5993754371f0ebe8ee7a150784db2d31cce8d2b8d87
Shown source SHA256: b5b2bfa161ed04e7fe26a5993754371f0ebe8ee7a150784db2d31cce8d2b8d87
Shown target SHA256: b5b2bfa161ed04e7fe26a5993754371f0ebe8ee7a150784db2d31cce8d2b8d87

### Proposed decision

```json
{
  "claimId": "claim_6db587e2ef915e1712ab70cda121dde4",
  "sourceUnitDigest": "b5b2bfa161ed04e7fe26a5993754371f0ebe8ee7a150784db2d31cce8d2b8d87",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-135",
  "targetUnitDigest": "b5b2bfa161ed04e7fe26a5993754371f0ebe8ee7a150784db2d31cce8d2b8d87",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "14. Migration Strategy"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-132 (lines 763–763) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-135 (lines 787–787); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
This is a hard-cut migration. Downtime is acceptable.
```

### Full target shown text

```text
This is a hard-cut migration. Downtime is acceptable.
```

## claim_ebb45bbb39ff06e315a77a69a5c2d1f5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-133, lines 765–781.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-136.
Source digest: f73b4b0864c8f895a581ff319707e76db6b098e9130b77148ec508bff90eda70
Target digest: f73b4b0864c8f895a581ff319707e76db6b098e9130b77148ec508bff90eda70
Shown source SHA256: f73b4b0864c8f895a581ff319707e76db6b098e9130b77148ec508bff90eda70
Shown target SHA256: f73b4b0864c8f895a581ff319707e76db6b098e9130b77148ec508bff90eda70

### Proposed decision

```json
{
  "claimId": "claim_ebb45bbb39ff06e315a77a69a5c2d1f5",
  "sourceUnitDigest": "f73b4b0864c8f895a581ff319707e76db6b098e9130b77148ec508bff90eda70",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-136",
  "targetUnitDigest": "f73b4b0864c8f895a581ff319707e76db6b098e9130b77148ec508bff90eda70",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "14. Migration Strategy"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-133 (lines 765–781) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-136 (lines 789–805); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Recommended steps:

1. Stop runners and user claim flows.
2. Ensure durable event logs are committed or otherwise safely backed up.
3. Introduce runtime coordination storage and ignore rules.
4. Introduce attempt events and replay projection.
5. Introduce effective view.
6. Change claim acquire to runtime-only.
7. Change settle/release/reject/verify-fail to validate runtime claim plus durable pre-claim revision.
8. Change frontier, list, query, worker-slot, stale reclaim, and dashboards to effective view.
9. Change anti-loop to attempt history.
10. Retire `releaseClaimOnExecuting`.
11. Run migration over existing durable `doing` events:
    - convert active durable `doing` items either into runtime claims if there is a live valid owner, or into durable attempt records with `released`, `reclaimed`, or `abandoned`;
    - leave no item stranded in durable current status `doing`;
    - recompute `attemptCount`, `lastAttempt`, and item revisions.
12. Run full verification before allowing new claims.
```

### Full target shown text

```text
Recommended steps:

1. Stop runners and user claim flows.
2. Ensure durable event logs are committed or otherwise safely backed up.
3. Introduce runtime coordination storage and ignore rules.
4. Introduce attempt events and replay projection.
5. Introduce effective view.
6. Change claim acquire to runtime-only.
7. Change settle/release/reject/verify-fail to validate runtime claim plus durable pre-claim revision.
8. Change frontier, list, query, worker-slot, stale reclaim, and dashboards to effective view.
9. Change anti-loop to attempt history.
10. Retire `releaseClaimOnExecuting`.
11. Run migration over existing durable `doing` events:
    - convert active durable `doing` items either into runtime claims if there is a live valid owner, or into durable attempt records with `released`, `reclaimed`, or `abandoned`;
    - leave no item stranded in durable current status `doing`;
    - recompute `attemptCount`, `lastAttempt`, and item revisions.
12. Run full verification before allowing new claims.
```

## claim_18ef34f1168e67b8b0508f9327427684

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-134, lines 783–783.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-137.
Source digest: ed8c3aa76857d32866290ba3ab7bbd6861373e9c77dee7362cfe436605c6657c
Target digest: ed8c3aa76857d32866290ba3ab7bbd6861373e9c77dee7362cfe436605c6657c
Shown source SHA256: ed8c3aa76857d32866290ba3ab7bbd6861373e9c77dee7362cfe436605c6657c
Shown target SHA256: ed8c3aa76857d32866290ba3ab7bbd6861373e9c77dee7362cfe436605c6657c

### Proposed decision

```json
{
  "claimId": "claim_18ef34f1168e67b8b0508f9327427684",
  "sourceUnitDigest": "ed8c3aa76857d32866290ba3ab7bbd6861373e9c77dee7362cfe436605c6657c",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-137",
  "targetUnitDigest": "ed8c3aa76857d32866290ba3ab7bbd6861373e9c77dee7362cfe436605c6657c",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "14. Migration Strategy"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-134 (lines 783–783) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-137 (lines 807–807); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
After migration, durable current `doing` should not remain as a normal live state.
```

### Full target shown text

```text
After migration, durable current `doing` should not remain as a normal live state.
```

## claim_1b165bbe1765234480d298ec7e51bef9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#15-acceptance-criteria, lines 785–785.
Target: docs/platform/proposals/doing-coordination-redesign.md#15-acceptance-criteria.
Source digest: 0d79c85f94a4cad68de5527940e9a9198a6e21d85bada6d87b3ba0070efd51fb
Target digest: 0d79c85f94a4cad68de5527940e9a9198a6e21d85bada6d87b3ba0070efd51fb
Shown source SHA256: 2dfce6f8dcce1b84398aae42b97f1f7d047be6591a583dc387b21951fd10a553
Shown target SHA256: 2dfce6f8dcce1b84398aae42b97f1f7d047be6591a583dc387b21951fd10a553

### Proposed decision

```json
{
  "claimId": "claim_1b165bbe1765234480d298ec7e51bef9",
  "sourceUnitDigest": "0d79c85f94a4cad68de5527940e9a9198a6e21d85bada6d87b3ba0070efd51fb",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "15-acceptance-criteria",
  "targetUnitDigest": "0d79c85f94a4cad68de5527940e9a9198a6e21d85bada6d87b3ba0070efd51fb",
  "targetAncestry": [
    "Doing Coordination Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#15-acceptance-criteria (lines 785–785) is carried at docs/platform/proposals/doing-coordination-redesign.md#15-acceptance-criteria (lines 809–809); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 15. Acceptance Criteria

The redesign is acceptable only if all conditions hold:

1. Claim acquire does not append `work.move -> doing`.
2. `list --status doing` still returns actively claimed items.
3. `list --status todo` excludes actively claimed items in the default effective view.
4. A released item is distinguishable from a never-started item.
5. Return/reject/verify-fail do not use `expectedStatus: "doing"` as their CAS base.
6. Double-claim attempts for the same item cannot both succeed.
7. Stale reclaim uses real liveness as the primary signal.
8. Anti-loop counts durable execution attempts.
9. Frontier cannot pick an active-claimed durable-`todo` item.
10. Runtime coordination files and diagnostic logs are ignored by git.
11. Durable event logs still capture meaningful attempt and workflow outcomes.
12. No normal flow leaves an item durable-current `doing` after the hard cut.
13. Asking a question while an item is effective `doing` does not persist
    `statusAtAsk: "doing"` as the durable resume target.
14. Answering a human question never writes durable `awaiting-human -> doing`;
    continuation to `doing` happens only by runtime claim overlay.
```

### Full target shown text

```text
## 15. Acceptance Criteria

The redesign is acceptable only if all conditions hold:

1. Claim acquire does not append `work.move -> doing`.
2. `list --status doing` still returns actively claimed items.
3. `list --status todo` excludes actively claimed items in the default effective view.
4. A released item is distinguishable from a never-started item.
5. Return/reject/verify-fail do not use `expectedStatus: "doing"` as their CAS base.
6. Double-claim attempts for the same item cannot both succeed.
7. Stale reclaim uses real liveness as the primary signal.
8. Anti-loop counts durable execution attempts.
9. Frontier cannot pick an active-claimed durable-`todo` item.
10. Runtime coordination files and diagnostic logs are ignored by git.
11. Durable event logs still capture meaningful attempt and workflow outcomes.
12. No normal flow leaves an item durable-current `doing` after the hard cut.
13. Asking a question while an item is effective `doing` does not persist
    `statusAtAsk: "doing"` as the durable resume target.
14. Answering a human question never writes durable `awaiting-human -> doing`;
    continuation to `doing` happens only by runtime claim overlay.
```

## claim_6e6ef9fdfec1e2c1389afdfe63c34b38

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-135, lines 787–787.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-138.
Source digest: 35318086fd52c60741c5673fb5fde01f8195ad3a49234e838aad7740c3648e80
Target digest: 35318086fd52c60741c5673fb5fde01f8195ad3a49234e838aad7740c3648e80
Shown source SHA256: 35318086fd52c60741c5673fb5fde01f8195ad3a49234e838aad7740c3648e80
Shown target SHA256: 35318086fd52c60741c5673fb5fde01f8195ad3a49234e838aad7740c3648e80

### Proposed decision

```json
{
  "claimId": "claim_6e6ef9fdfec1e2c1389afdfe63c34b38",
  "sourceUnitDigest": "35318086fd52c60741c5673fb5fde01f8195ad3a49234e838aad7740c3648e80",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-138",
  "targetUnitDigest": "35318086fd52c60741c5673fb5fde01f8195ad3a49234e838aad7740c3648e80",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "15. Acceptance Criteria"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-135 (lines 787–787) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-138 (lines 811–811); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The redesign is acceptable only if all conditions hold:
```

### Full target shown text

```text
The redesign is acceptable only if all conditions hold:
```

## claim_daed4c7a57bebf9f5e87fbec87d5ff46

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-136, lines 789–804.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-139.
Source digest: 1de34a6174f0ac4ded61fad8dc0f318402cd4ba4b4a6129cbb520b422fef99b3
Target digest: 1de34a6174f0ac4ded61fad8dc0f318402cd4ba4b4a6129cbb520b422fef99b3
Shown source SHA256: 1de34a6174f0ac4ded61fad8dc0f318402cd4ba4b4a6129cbb520b422fef99b3
Shown target SHA256: 1de34a6174f0ac4ded61fad8dc0f318402cd4ba4b4a6129cbb520b422fef99b3

### Proposed decision

```json
{
  "claimId": "claim_daed4c7a57bebf9f5e87fbec87d5ff46",
  "sourceUnitDigest": "1de34a6174f0ac4ded61fad8dc0f318402cd4ba4b4a6129cbb520b422fef99b3",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-139",
  "targetUnitDigest": "1de34a6174f0ac4ded61fad8dc0f318402cd4ba4b4a6129cbb520b422fef99b3",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "15. Acceptance Criteria"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-136 (lines 789–804) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-139 (lines 813–828); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
1. Claim acquire does not append `work.move -> doing`.
2. `list --status doing` still returns actively claimed items.
3. `list --status todo` excludes actively claimed items in the default effective view.
4. A released item is distinguishable from a never-started item.
5. Return/reject/verify-fail do not use `expectedStatus: "doing"` as their CAS base.
6. Double-claim attempts for the same item cannot both succeed.
7. Stale reclaim uses real liveness as the primary signal.
8. Anti-loop counts durable execution attempts.
9. Frontier cannot pick an active-claimed durable-`todo` item.
10. Runtime coordination files and diagnostic logs are ignored by git.
11. Durable event logs still capture meaningful attempt and workflow outcomes.
12. No normal flow leaves an item durable-current `doing` after the hard cut.
13. Asking a question while an item is effective `doing` does not persist
    `statusAtAsk: "doing"` as the durable resume target.
14. Answering a human question never writes durable `awaiting-human -> doing`;
    continuation to `doing` happens only by runtime claim overlay.
```

### Full target shown text

```text
1. Claim acquire does not append `work.move -> doing`.
2. `list --status doing` still returns actively claimed items.
3. `list --status todo` excludes actively claimed items in the default effective view.
4. A released item is distinguishable from a never-started item.
5. Return/reject/verify-fail do not use `expectedStatus: "doing"` as their CAS base.
6. Double-claim attempts for the same item cannot both succeed.
7. Stale reclaim uses real liveness as the primary signal.
8. Anti-loop counts durable execution attempts.
9. Frontier cannot pick an active-claimed durable-`todo` item.
10. Runtime coordination files and diagnostic logs are ignored by git.
11. Durable event logs still capture meaningful attempt and workflow outcomes.
12. No normal flow leaves an item durable-current `doing` after the hard cut.
13. Asking a question while an item is effective `doing` does not persist
    `statusAtAsk: "doing"` as the durable resume target.
14. Answering a human question never writes durable `awaiting-human -> doing`;
    continuation to `doing` happens only by runtime claim overlay.
```

## claim_a1f47bc9a999752ace2c99ddc8f29607

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#16-required-tests, lines 806–806.
Target: docs/platform/proposals/doing-coordination-redesign.md#16-required-tests.
Source digest: a5fc6a6c9fb156d9c36e0d7b6b0c482369c21127b3280253e51633a760117602
Target digest: a5fc6a6c9fb156d9c36e0d7b6b0c482369c21127b3280253e51633a760117602
Shown source SHA256: 7a3b2f0f21b68a8d1c6c39de6bfcad222c925700d28f1e20ac352e0f4cac7cd2
Shown target SHA256: 7a3b2f0f21b68a8d1c6c39de6bfcad222c925700d28f1e20ac352e0f4cac7cd2

### Proposed decision

```json
{
  "claimId": "claim_a1f47bc9a999752ace2c99ddc8f29607",
  "sourceUnitDigest": "a5fc6a6c9fb156d9c36e0d7b6b0c482369c21127b3280253e51633a760117602",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "16-required-tests",
  "targetUnitDigest": "a5fc6a6c9fb156d9c36e0d7b6b0c482369c21127b3280253e51633a760117602",
  "targetAncestry": [
    "Doing Coordination Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#16-required-tests (lines 806–806) is carried at docs/platform/proposals/doing-coordination-redesign.md#16-required-tests (lines 830–830); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 16. Required Tests
```

### Full target shown text

```text
## 16. Required Tests
```

## claim_88eafffe93d9cce967b60390bf213949

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#161-claim-acquire, lines 808–808.
Target: docs/platform/proposals/doing-coordination-redesign.md#161-claim-acquire.
Source digest: 4a847a870f98306016dc7f36bcdfd5e53b9986142823b07f6756022678ba6b36
Target digest: 4a847a870f98306016dc7f36bcdfd5e53b9986142823b07f6756022678ba6b36
Shown source SHA256: 7a60cdc833c1bf57a30c286ae3c706e83eb2935597d04cde599fdd38273e4104
Shown target SHA256: 7a60cdc833c1bf57a30c286ae3c706e83eb2935597d04cde599fdd38273e4104

### Proposed decision

```json
{
  "claimId": "claim_88eafffe93d9cce967b60390bf213949",
  "sourceUnitDigest": "4a847a870f98306016dc7f36bcdfd5e53b9986142823b07f6756022678ba6b36",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "161-claim-acquire",
  "targetUnitDigest": "4a847a870f98306016dc7f36bcdfd5e53b9986142823b07f6756022678ba6b36",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "16. Required Tests"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#161-claim-acquire (lines 808–808) is carried at docs/platform/proposals/doing-coordination-redesign.md#161-claim-acquire (lines 832–832); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 16.1 Claim Acquire

- Claiming a `todo` item creates an active runtime claim.
- Claiming does not append durable `doing`.
- A second claim for the same item fails while the first active claim exists.
- If worktree/branch preparation fails, the runtime claim is cleaned up or marked failed without durable `doing` residue.
```

### Full target shown text

```text
### 16.1 Claim Acquire

- Claiming a `todo` item creates an active runtime claim.
- Claiming does not append durable `doing`.
- A second claim for the same item fails while the first active claim exists.
- If worktree/branch preparation fails, the runtime claim is cleaned up or marked failed without durable `doing` residue.
```

## claim_3f56c899ad1cd3fc76627e4e7f1cdbf7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-137, lines 810–813.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-140.
Source digest: f5db9efcf4b2c8bab450dbf09e91826cad7b9499a3cdd8d3a52f7c21c466d6e8
Target digest: f5db9efcf4b2c8bab450dbf09e91826cad7b9499a3cdd8d3a52f7c21c466d6e8
Shown source SHA256: f5db9efcf4b2c8bab450dbf09e91826cad7b9499a3cdd8d3a52f7c21c466d6e8
Shown target SHA256: f5db9efcf4b2c8bab450dbf09e91826cad7b9499a3cdd8d3a52f7c21c466d6e8

### Proposed decision

```json
{
  "claimId": "claim_3f56c899ad1cd3fc76627e4e7f1cdbf7",
  "sourceUnitDigest": "f5db9efcf4b2c8bab450dbf09e91826cad7b9499a3cdd8d3a52f7c21c466d6e8",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-140",
  "targetUnitDigest": "f5db9efcf4b2c8bab450dbf09e91826cad7b9499a3cdd8d3a52f7c21c466d6e8",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "16. Required Tests",
    "16.1 Claim Acquire"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-137 (lines 810–813) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-140 (lines 834–837); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- Claiming a `todo` item creates an active runtime claim.
- Claiming does not append durable `doing`.
- A second claim for the same item fails while the first active claim exists.
- If worktree/branch preparation fails, the runtime claim is cleaned up or marked failed without durable `doing` residue.
```

### Full target shown text

```text
- Claiming a `todo` item creates an active runtime claim.
- Claiming does not append durable `doing`.
- A second claim for the same item fails while the first active claim exists.
- If worktree/branch preparation fails, the runtime claim is cleaned up or marked failed without durable `doing` residue.
```

## claim_66d50a10d912c98d174a07ce4bd3fdcb

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#162-effective-view, lines 815–815.
Target: docs/platform/proposals/doing-coordination-redesign.md#162-effective-view.
Source digest: 79207c7413f4ae4d4bdbb42c7b9ea38c26d2ca1928be9265e794788f490547ed
Target digest: 79207c7413f4ae4d4bdbb42c7b9ea38c26d2ca1928be9265e794788f490547ed
Shown source SHA256: 769a1f6d98b100fe459ad29d998b007b8633a7282a1a50aaee39104a4c9d15e5
Shown target SHA256: 769a1f6d98b100fe459ad29d998b007b8633a7282a1a50aaee39104a4c9d15e5

### Proposed decision

```json
{
  "claimId": "claim_66d50a10d912c98d174a07ce4bd3fdcb",
  "sourceUnitDigest": "79207c7413f4ae4d4bdbb42c7b9ea38c26d2ca1928be9265e794788f490547ed",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "162-effective-view",
  "targetUnitDigest": "79207c7413f4ae4d4bdbb42c7b9ea38c26d2ca1928be9265e794788f490547ed",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "16. Required Tests"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#162-effective-view (lines 815–815) is carried at docs/platform/proposals/doing-coordination-redesign.md#162-effective-view (lines 839–839); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 16.2 Effective View

- Durable `todo` plus active claim renders as effective `doing`.
- Durable `todo` without active claim renders as effective `todo`.
- Released item renders as effective `todo` with `attemptCount > 0`.
- Durable-only debug view can still show raw durable status.
```

### Full target shown text

```text
### 16.2 Effective View

- Durable `todo` plus active claim renders as effective `doing`.
- Durable `todo` without active claim renders as effective `todo`.
- Released item renders as effective `todo` with `attemptCount > 0`.
- Durable-only debug view can still show raw durable status.
```

## claim_271f53387c3ddf763fc61b5a0f2dab54

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-138, lines 817–820.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-141.
Source digest: 00149932dba8c2d516614554f8fdbb38e251c98b9471227ed7e595910598f796
Target digest: 00149932dba8c2d516614554f8fdbb38e251c98b9471227ed7e595910598f796
Shown source SHA256: 00149932dba8c2d516614554f8fdbb38e251c98b9471227ed7e595910598f796
Shown target SHA256: 00149932dba8c2d516614554f8fdbb38e251c98b9471227ed7e595910598f796

### Proposed decision

```json
{
  "claimId": "claim_271f53387c3ddf763fc61b5a0f2dab54",
  "sourceUnitDigest": "00149932dba8c2d516614554f8fdbb38e251c98b9471227ed7e595910598f796",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-141",
  "targetUnitDigest": "00149932dba8c2d516614554f8fdbb38e251c98b9471227ed7e595910598f796",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "16. Required Tests",
    "16.2 Effective View"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-138 (lines 817–820) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-141 (lines 841–844); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- Durable `todo` plus active claim renders as effective `doing`.
- Durable `todo` without active claim renders as effective `todo`.
- Released item renders as effective `todo` with `attemptCount > 0`.
- Durable-only debug view can still show raw durable status.
```

### Full target shown text

```text
- Durable `todo` plus active claim renders as effective `doing`.
- Durable `todo` without active claim renders as effective `todo`.
- Released item renders as effective `todo` with `attemptCount > 0`.
- Durable-only debug view can still show raw durable status.
```

## claim_4df65d1dcfcf7b76a14710d4f9678b4a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#163-settle, lines 822–822.
Target: docs/platform/proposals/doing-coordination-redesign.md#163-settle.
Source digest: 00a13389a327df01d3788c0375a62e59fd436db05187d0f4b86585de7161576c
Target digest: 00a13389a327df01d3788c0375a62e59fd436db05187d0f4b86585de7161576c
Shown source SHA256: 65ca058fcd2e4bd221fa8292be7a4537e5a7f9123d976ebd09c7923092b32733
Shown target SHA256: 65ca058fcd2e4bd221fa8292be7a4537e5a7f9123d976ebd09c7923092b32733

### Proposed decision

```json
{
  "claimId": "claim_4df65d1dcfcf7b76a14710d4f9678b4a",
  "sourceUnitDigest": "00a13389a327df01d3788c0375a62e59fd436db05187d0f4b86585de7161576c",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "163-settle",
  "targetUnitDigest": "00a13389a327df01d3788c0375a62e59fd436db05187d0f4b86585de7161576c",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "16. Required Tests"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#163-settle (lines 822–822) is carried at docs/platform/proposals/doing-coordination-redesign.md#163-settle (lines 846–846); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 16.3 Settle

- Successful return validates `claimId`, owner, `preClaimStatus`, and `preClaimRevision`.
- Successful return writes attempt history and final workflow move.
- Settlement with missing/wrong claim fails.
- Settlement after durable revision drift fails or goes through explicit reconcile.
- Verify-fail parks according to policy and records attempt history.
```

### Full target shown text

```text
### 16.3 Settle

- Successful return validates `claimId`, owner, `preClaimStatus`, and `preClaimRevision`.
- Successful return writes attempt history and final workflow move.
- Settlement with missing/wrong claim fails.
- Settlement after durable revision drift fails or goes through explicit reconcile.
- Verify-fail parks according to policy and records attempt history.
```

## claim_8fe6c7a6fea0e4fc3f7c86893f590dfa

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-139, lines 824–828.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-142.
Source digest: e7c45ac5c9baedcfe85b790a023f376237fa736fffdb296a187f29c6fed1681a
Target digest: e7c45ac5c9baedcfe85b790a023f376237fa736fffdb296a187f29c6fed1681a
Shown source SHA256: e7c45ac5c9baedcfe85b790a023f376237fa736fffdb296a187f29c6fed1681a
Shown target SHA256: e7c45ac5c9baedcfe85b790a023f376237fa736fffdb296a187f29c6fed1681a

### Proposed decision

```json
{
  "claimId": "claim_8fe6c7a6fea0e4fc3f7c86893f590dfa",
  "sourceUnitDigest": "e7c45ac5c9baedcfe85b790a023f376237fa736fffdb296a187f29c6fed1681a",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-142",
  "targetUnitDigest": "e7c45ac5c9baedcfe85b790a023f376237fa736fffdb296a187f29c6fed1681a",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "16. Required Tests",
    "16.3 Settle"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-139 (lines 824–828) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-142 (lines 848–852); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- Successful return validates `claimId`, owner, `preClaimStatus`, and `preClaimRevision`.
- Successful return writes attempt history and final workflow move.
- Settlement with missing/wrong claim fails.
- Settlement after durable revision drift fails or goes through explicit reconcile.
- Verify-fail parks according to policy and records attempt history.
```

### Full target shown text

```text
- Successful return validates `claimId`, owner, `preClaimStatus`, and `preClaimRevision`.
- Successful return writes attempt history and final workflow move.
- Settlement with missing/wrong claim fails.
- Settlement after durable revision drift fails or goes through explicit reconcile.
- Verify-fail parks according to policy and records attempt history.
```

## claim_b7baab2d7b6c429a106490dc64725e4d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#164-reclaim, lines 830–830.
Target: docs/platform/proposals/doing-coordination-redesign.md#164-reclaim.
Source digest: bf1f1e7480233ab0c2a1d2fdb14041d62a38ed363ebc432de8c904b8025ec803
Target digest: bf1f1e7480233ab0c2a1d2fdb14041d62a38ed363ebc432de8c904b8025ec803
Shown source SHA256: 32a12059b49f1c6b0f9419e29ee4869ea5576b35adb12b1410039a1a7dd69206
Shown target SHA256: 32a12059b49f1c6b0f9419e29ee4869ea5576b35adb12b1410039a1a7dd69206

### Proposed decision

```json
{
  "claimId": "claim_b7baab2d7b6c429a106490dc64725e4d",
  "sourceUnitDigest": "bf1f1e7480233ab0c2a1d2fdb14041d62a38ed363ebc432de8c904b8025ec803",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "164-reclaim",
  "targetUnitDigest": "bf1f1e7480233ab0c2a1d2fdb14041d62a38ed363ebc432de8c904b8025ec803",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "16. Required Tests"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#164-reclaim (lines 830–830) is carried at docs/platform/proposals/doing-coordination-redesign.md#164-reclaim (lines 854–854); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 16.4 Reclaim

- Active worktree activity prevents reclaim before role-specific liveness threshold.
- Inactive claim becomes reclaim-eligible after real inactivity.
- `hardExpiresAt` works only as a backstop.
- Reclaim writes durable attempt history and removes runtime active ownership.
```

### Full target shown text

```text
### 16.4 Reclaim

- Active worktree activity prevents reclaim before role-specific liveness threshold.
- Inactive claim becomes reclaim-eligible after real inactivity.
- `hardExpiresAt` works only as a backstop.
- Reclaim writes durable attempt history and removes runtime active ownership.
```

## claim_e3d5cd041b15b0a3e6ddd802205acfba

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-140, lines 832–835.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-143.
Source digest: b8a094ebb77ae5337c8c41f4ed960fd73bd39448847e6de26a13c5ba06a049e9
Target digest: b8a094ebb77ae5337c8c41f4ed960fd73bd39448847e6de26a13c5ba06a049e9
Shown source SHA256: b8a094ebb77ae5337c8c41f4ed960fd73bd39448847e6de26a13c5ba06a049e9
Shown target SHA256: b8a094ebb77ae5337c8c41f4ed960fd73bd39448847e6de26a13c5ba06a049e9

### Proposed decision

```json
{
  "claimId": "claim_e3d5cd041b15b0a3e6ddd802205acfba",
  "sourceUnitDigest": "b8a094ebb77ae5337c8c41f4ed960fd73bd39448847e6de26a13c5ba06a049e9",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-143",
  "targetUnitDigest": "b8a094ebb77ae5337c8c41f4ed960fd73bd39448847e6de26a13c5ba06a049e9",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "16. Required Tests",
    "16.4 Reclaim"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-140 (lines 832–835) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-143 (lines 856–859); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- Active worktree activity prevents reclaim before role-specific liveness threshold.
- Inactive claim becomes reclaim-eligible after real inactivity.
- `hardExpiresAt` works only as a backstop.
- Reclaim writes durable attempt history and removes runtime active ownership.
```

### Full target shown text

```text
- Active worktree activity prevents reclaim before role-specific liveness threshold.
- Inactive claim becomes reclaim-eligible after real inactivity.
- `hardExpiresAt` works only as a backstop.
- Reclaim writes durable attempt history and removes runtime active ownership.
```

## claim_2270d8e4bb5b2bf85adf14743e65ef40

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#165-frontier-and-worker-slots, lines 837–837.
Target: docs/platform/proposals/doing-coordination-redesign.md#165-frontier-and-worker-slots.
Source digest: 58dc091f6165c83fbdff42aea970b64b6101e477606eebb4f0362202210aef41
Target digest: 58dc091f6165c83fbdff42aea970b64b6101e477606eebb4f0362202210aef41
Shown source SHA256: 9ca2647fe982bf17284564d6e9c5b5abb4eb6315add9b60368709a8814f7f8f5
Shown target SHA256: 9ca2647fe982bf17284564d6e9c5b5abb4eb6315add9b60368709a8814f7f8f5

### Proposed decision

```json
{
  "claimId": "claim_2270d8e4bb5b2bf85adf14743e65ef40",
  "sourceUnitDigest": "58dc091f6165c83fbdff42aea970b64b6101e477606eebb4f0362202210aef41",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "165-frontier-and-worker-slots",
  "targetUnitDigest": "58dc091f6165c83fbdff42aea970b64b6101e477606eebb4f0362202210aef41",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "16. Required Tests"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#165-frontier-and-worker-slots (lines 837–837) is carried at docs/platform/proposals/doing-coordination-redesign.md#165-frontier-and-worker-slots (lines 861–861); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 16.5 Frontier And Worker Slots

- Active-claimed durable `todo` item is not returned by frontier.
- Open descendant calculation treats effective `doing` as open.
- Worker slots count active runtime claims.
- Reclaimed/released items become eligible again according to dependencies and policy.
```

### Full target shown text

```text
### 16.5 Frontier And Worker Slots

- Active-claimed durable `todo` item is not returned by frontier.
- Open descendant calculation treats effective `doing` as open.
- Worker slots count active runtime claims.
- Reclaimed/released items become eligible again according to dependencies and policy.
```

## claim_49eccc468f6606313d4f4b5282b27b0a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-141, lines 839–842.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-144.
Source digest: 29e2ed336c7942675092c64e7d6ad509f1386745f1f007bfc3357e0e65756805
Target digest: 29e2ed336c7942675092c64e7d6ad509f1386745f1f007bfc3357e0e65756805
Shown source SHA256: 29e2ed336c7942675092c64e7d6ad509f1386745f1f007bfc3357e0e65756805
Shown target SHA256: 29e2ed336c7942675092c64e7d6ad509f1386745f1f007bfc3357e0e65756805

### Proposed decision

```json
{
  "claimId": "claim_49eccc468f6606313d4f4b5282b27b0a",
  "sourceUnitDigest": "29e2ed336c7942675092c64e7d6ad509f1386745f1f007bfc3357e0e65756805",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-144",
  "targetUnitDigest": "29e2ed336c7942675092c64e7d6ad509f1386745f1f007bfc3357e0e65756805",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "16. Required Tests",
    "16.5 Frontier And Worker Slots"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-141 (lines 839–842) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-144 (lines 863–866); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- Active-claimed durable `todo` item is not returned by frontier.
- Open descendant calculation treats effective `doing` as open.
- Worker slots count active runtime claims.
- Reclaimed/released items become eligible again according to dependencies and policy.
```

### Full target shown text

```text
- Active-claimed durable `todo` item is not returned by frontier.
- Open descendant calculation treats effective `doing` as open.
- Worker slots count active runtime claims.
- Reclaimed/released items become eligible again according to dependencies and policy.
```

## claim_af889219feb09ed4491ab7cf8b54723a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#166-anti-loop, lines 844–844.
Target: docs/platform/proposals/doing-coordination-redesign.md#166-anti-loop.
Source digest: 5d7bc6f42e45d79debe8b2486b1f0277f9ae7dc76b1fcd88a1f65be6112ac4e8
Target digest: 5d7bc6f42e45d79debe8b2486b1f0277f9ae7dc76b1fcd88a1f65be6112ac4e8
Shown source SHA256: 686143c9e19635854b819f22121035f7daa38d18df96a567d80df1dff98870dd
Shown target SHA256: 686143c9e19635854b819f22121035f7daa38d18df96a567d80df1dff98870dd

### Proposed decision

```json
{
  "claimId": "claim_af889219feb09ed4491ab7cf8b54723a",
  "sourceUnitDigest": "5d7bc6f42e45d79debe8b2486b1f0277f9ae7dc76b1fcd88a1f65be6112ac4e8",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "166-anti-loop",
  "targetUnitDigest": "5d7bc6f42e45d79debe8b2486b1f0277f9ae7dc76b1fcd88a1f65be6112ac4e8",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "16. Required Tests"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#166-anti-loop (lines 844–844) is carried at docs/platform/proposals/doing-coordination-redesign.md#166-anti-loop (lines 868–868); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 16.6 Anti-Loop

- Execute attempt events increment visit count.
- Clarify/planning claims do not increment execute visit count unless explicitly modeled as execute attempts.
- Human reset events still reset the relevant anti-loop window.
```

### Full target shown text

```text
### 16.6 Anti-Loop

- Execute attempt events increment visit count.
- Clarify/planning claims do not increment execute visit count unless explicitly modeled as execute attempts.
- Human reset events still reset the relevant anti-loop window.
```

## claim_67b2058492610c195892d2ea2dff7093

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-142, lines 846–848.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-145.
Source digest: 772c88345663cdca21de8cde774d09ea1c9ddce8985f9cff1c7593355d32b5bd
Target digest: 772c88345663cdca21de8cde774d09ea1c9ddce8985f9cff1c7593355d32b5bd
Shown source SHA256: 772c88345663cdca21de8cde774d09ea1c9ddce8985f9cff1c7593355d32b5bd
Shown target SHA256: 772c88345663cdca21de8cde774d09ea1c9ddce8985f9cff1c7593355d32b5bd

### Proposed decision

```json
{
  "claimId": "claim_67b2058492610c195892d2ea2dff7093",
  "sourceUnitDigest": "772c88345663cdca21de8cde774d09ea1c9ddce8985f9cff1c7593355d32b5bd",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-145",
  "targetUnitDigest": "772c88345663cdca21de8cde774d09ea1c9ddce8985f9cff1c7593355d32b5bd",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "16. Required Tests",
    "16.6 Anti-Loop"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-142 (lines 846–848) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-145 (lines 870–872); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- Execute attempt events increment visit count.
- Clarify/planning claims do not increment execute visit count unless explicitly modeled as execute attempts.
- Human reset events still reset the relevant anti-loop window.
```

### Full target shown text

```text
- Execute attempt events increment visit count.
- Clarify/planning claims do not increment execute visit count unless explicitly modeled as execute attempts.
- Human reset events still reset the relevant anti-loop window.
```

## claim_94bf7a565054f7700b9b2d512ad3a53c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#167-migration, lines 850–850.
Target: docs/platform/proposals/doing-coordination-redesign.md#167-migration.
Source digest: b6ce4c4a026d53dc6b20846a44e55e0caa84cd37883e333cbacdc6134cebc921
Target digest: b6ce4c4a026d53dc6b20846a44e55e0caa84cd37883e333cbacdc6134cebc921
Shown source SHA256: 3aaa26c40aee93725c693f812110bcf18aaeac05e5936332b319e52e5f8dd4d7
Shown target SHA256: 3aaa26c40aee93725c693f812110bcf18aaeac05e5936332b319e52e5f8dd4d7

### Proposed decision

```json
{
  "claimId": "claim_94bf7a565054f7700b9b2d512ad3a53c",
  "sourceUnitDigest": "b6ce4c4a026d53dc6b20846a44e55e0caa84cd37883e333cbacdc6134cebc921",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "167-migration",
  "targetUnitDigest": "b6ce4c4a026d53dc6b20846a44e55e0caa84cd37883e333cbacdc6134cebc921",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "16. Required Tests"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#167-migration (lines 850–850) is carried at docs/platform/proposals/doing-coordination-redesign.md#167-migration (lines 874–874); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 16.7 Migration

- Existing durable current `doing` items are converted or parked.
- Existing event history produces correct `attemptCount`.
- No migrated item loses final workflow status.
- No runtime/derived/diagnostic file becomes tracked.
```

### Full target shown text

```text
### 16.7 Migration

- Existing durable current `doing` items are converted or parked.
- Existing event history produces correct `attemptCount`.
- No migrated item loses final workflow status.
- No runtime/derived/diagnostic file becomes tracked.
```

## claim_60d7a19cce153a7ea02d4c78e5ebbd10

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-143, lines 852–855.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-146.
Source digest: 5c23bfac9c26026290b0d5d66fba61ef8ee2f4731e6cf3f9e40a9fc0841637bd
Target digest: 5c23bfac9c26026290b0d5d66fba61ef8ee2f4731e6cf3f9e40a9fc0841637bd
Shown source SHA256: 5c23bfac9c26026290b0d5d66fba61ef8ee2f4731e6cf3f9e40a9fc0841637bd
Shown target SHA256: 5c23bfac9c26026290b0d5d66fba61ef8ee2f4731e6cf3f9e40a9fc0841637bd

### Proposed decision

```json
{
  "claimId": "claim_60d7a19cce153a7ea02d4c78e5ebbd10",
  "sourceUnitDigest": "5c23bfac9c26026290b0d5d66fba61ef8ee2f4731e6cf3f9e40a9fc0841637bd",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-146",
  "targetUnitDigest": "5c23bfac9c26026290b0d5d66fba61ef8ee2f4731e6cf3f9e40a9fc0841637bd",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "16. Required Tests",
    "16.7 Migration"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-143 (lines 852–855) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-146 (lines 876–879); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- Existing durable current `doing` items are converted or parked.
- Existing event history produces correct `attemptCount`.
- No migrated item loses final workflow status.
- No runtime/derived/diagnostic file becomes tracked.
```

### Full target shown text

```text
- Existing durable current `doing` items are converted or parked.
- Existing event history produces correct `attemptCount`.
- No migrated item loses final workflow status.
- No runtime/derived/diagnostic file becomes tracked.
```

## claim_1e22a17d947b88cdc981764702de0630

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#168-ask-and-answer-while-claimed, lines 857–857.
Target: docs/platform/proposals/doing-coordination-redesign.md#168-ask-and-answer-while-claimed.
Source digest: 34ab160cb4d8ad338cbf693cc583e5c6ddaa47becfeb1e83a75731780d1a58c4
Target digest: 34ab160cb4d8ad338cbf693cc583e5c6ddaa47becfeb1e83a75731780d1a58c4
Shown source SHA256: 48c5cd95bd6b8069463b2602a01f54fd401c44efb3b5be7798f2ea5c1a81b583
Shown target SHA256: 48c5cd95bd6b8069463b2602a01f54fd401c44efb3b5be7798f2ea5c1a81b583

### Proposed decision

```json
{
  "claimId": "claim_1e22a17d947b88cdc981764702de0630",
  "sourceUnitDigest": "34ab160cb4d8ad338cbf693cc583e5c6ddaa47becfeb1e83a75731780d1a58c4",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "168-ask-and-answer-while-claimed",
  "targetUnitDigest": "34ab160cb4d8ad338cbf693cc583e5c6ddaa47becfeb1e83a75731780d1a58c4",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "16. Required Tests"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#168-ask-and-answer-while-claimed (lines 857–857) is carried at docs/platform/proposals/doing-coordination-redesign.md#168-ask-and-answer-while-claimed (lines 881–881); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 16.8 Ask And Answer While Claimed

- A claimed durable-`todo` item renders as effective `doing`.
- Asking on that item parks it as durable/effective `awaiting-human` and removes
  or pauses the active claim so it no longer renders as `doing`.
- Asking on that item records durable attempt history if it ends an active claim,
  so the item remains distinguishable from never-started work.
- Answering resumes to the durable base, such as `todo`, and writes no durable
  `awaiting-human -> doing` event.
- If answer handling immediately reacquires work, durable status remains the
  stable base while effective status becomes `doing` through the new runtime
  claim.
- Worker slots do not count the parked question as active work.
- Reclaim does not treat parked human questions as stale doing.
```

### Full target shown text

```text
### 16.8 Ask And Answer While Claimed

- A claimed durable-`todo` item renders as effective `doing`.
- Asking on that item parks it as durable/effective `awaiting-human` and removes
  or pauses the active claim so it no longer renders as `doing`.
- Asking on that item records durable attempt history if it ends an active claim,
  so the item remains distinguishable from never-started work.
- Answering resumes to the durable base, such as `todo`, and writes no durable
  `awaiting-human -> doing` event.
- If answer handling immediately reacquires work, durable status remains the
  stable base while effective status becomes `doing` through the new runtime
  claim.
- Worker slots do not count the parked question as active work.
- Reclaim does not treat parked human questions as stale doing.
```

## claim_c7f4e13fa163bf9a4ed54c4a4f5f43ad

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-144, lines 859–870.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-147.
Source digest: ad6b2fb06dca83999a71dc6ba2351e709671f87640c21cc17c8596fdd5133d14
Target digest: ad6b2fb06dca83999a71dc6ba2351e709671f87640c21cc17c8596fdd5133d14
Shown source SHA256: ad6b2fb06dca83999a71dc6ba2351e709671f87640c21cc17c8596fdd5133d14
Shown target SHA256: ad6b2fb06dca83999a71dc6ba2351e709671f87640c21cc17c8596fdd5133d14

### Proposed decision

```json
{
  "claimId": "claim_c7f4e13fa163bf9a4ed54c4a4f5f43ad",
  "sourceUnitDigest": "ad6b2fb06dca83999a71dc6ba2351e709671f87640c21cc17c8596fdd5133d14",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-147",
  "targetUnitDigest": "ad6b2fb06dca83999a71dc6ba2351e709671f87640c21cc17c8596fdd5133d14",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "16. Required Tests",
    "16.8 Ask And Answer While Claimed"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-144 (lines 859–870) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-147 (lines 883–894); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- A claimed durable-`todo` item renders as effective `doing`.
- Asking on that item parks it as durable/effective `awaiting-human` and removes
  or pauses the active claim so it no longer renders as `doing`.
- Asking on that item records durable attempt history if it ends an active claim,
  so the item remains distinguishable from never-started work.
- Answering resumes to the durable base, such as `todo`, and writes no durable
  `awaiting-human -> doing` event.
- If answer handling immediately reacquires work, durable status remains the
  stable base while effective status becomes `doing` through the new runtime
  claim.
- Worker slots do not count the parked question as active work.
- Reclaim does not treat parked human questions as stale doing.
```

### Full target shown text

```text
- A claimed durable-`todo` item renders as effective `doing`.
- Asking on that item parks it as durable/effective `awaiting-human` and removes
  or pauses the active claim so it no longer renders as `doing`.
- Asking on that item records durable attempt history if it ends an active claim,
  so the item remains distinguishable from never-started work.
- Answering resumes to the durable base, such as `todo`, and writes no durable
  `awaiting-human -> doing` event.
- If answer handling immediately reacquires work, durable status remains the
  stable base while effective status becomes `doing` through the new runtime
  claim.
- Worker slots do not count the parked question as active work.
- Reclaim does not treat parked human questions as stale doing.
```

## claim_7cef0a79e7e6151a7f28d5d4858c1caf

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#17-review-checklist, lines 872–872.
Target: docs/platform/proposals/doing-coordination-redesign.md#17-review-checklist.
Source digest: 4bc39fe34bec7deb8eeb5ec0154430a17c137eb5df421201a15149ca885a0c2e
Target digest: 4bc39fe34bec7deb8eeb5ec0154430a17c137eb5df421201a15149ca885a0c2e
Shown source SHA256: 027db9e8aee29c8c9122473c1b899f2804be349725297ea17c81d1ccc08dee90
Shown target SHA256: 027db9e8aee29c8c9122473c1b899f2804be349725297ea17c81d1ccc08dee90

### Proposed decision

```json
{
  "claimId": "claim_7cef0a79e7e6151a7f28d5d4858c1caf",
  "sourceUnitDigest": "4bc39fe34bec7deb8eeb5ec0154430a17c137eb5df421201a15149ca885a0c2e",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "17-review-checklist",
  "targetUnitDigest": "4bc39fe34bec7deb8eeb5ec0154430a17c137eb5df421201a15149ca885a0c2e",
  "targetAncestry": [
    "Doing Coordination Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#17-review-checklist (lines 872–872) is carried at docs/platform/proposals/doing-coordination-redesign.md#17-review-checklist (lines 896–896); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
## 17. Review Checklist

Before merge, reviewers should search for:

```txt
to: "doing"
to:'doing'
expectedStatus: "doing"
expectedStatus:'doing'
awaiting-human -> doing
status === "doing"
statusCategory === "doing"
releaseClaimOnExecuting
```

Each remaining occurrence must be classified as one of:

- effective status presentation;
- durable attempt history;
- migration code;
- test fixture for old-to-new migration;
- bug.

No unclassified occurrence should merge.

Reviewers should also verify every reader that schedules or displays current work reads the effective view, not the durable-only view.
````

### Full target shown text

````text
## 17. Review Checklist

Before merge, reviewers should search for:

```txt
to: "doing"
to:'doing'
expectedStatus: "doing"
expectedStatus:'doing'
awaiting-human -> doing
status === "doing"
statusCategory === "doing"
releaseClaimOnExecuting
```

Each remaining occurrence must be classified as one of:

- effective status presentation;
- durable attempt history;
- migration code;
- test fixture for old-to-new migration;
- bug.

No unclassified occurrence should merge.

Reviewers should also verify every reader that schedules or displays current work reads the effective view, not the durable-only view.
````

## claim_a99905c21a7535206a5489354a563d21

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-145, lines 874–874.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-148.
Source digest: 1a53951759a78e2c409168d8872fa53566433681048ca69d121b970f17f067e9
Target digest: 1a53951759a78e2c409168d8872fa53566433681048ca69d121b970f17f067e9
Shown source SHA256: 1a53951759a78e2c409168d8872fa53566433681048ca69d121b970f17f067e9
Shown target SHA256: 1a53951759a78e2c409168d8872fa53566433681048ca69d121b970f17f067e9

### Proposed decision

```json
{
  "claimId": "claim_a99905c21a7535206a5489354a563d21",
  "sourceUnitDigest": "1a53951759a78e2c409168d8872fa53566433681048ca69d121b970f17f067e9",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-148",
  "targetUnitDigest": "1a53951759a78e2c409168d8872fa53566433681048ca69d121b970f17f067e9",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "17. Review Checklist"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-145 (lines 874–874) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-148 (lines 898–898); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Before merge, reviewers should search for:
```

### Full target shown text

```text
Before merge, reviewers should search for:
```

## claim_549c848984871ede1e37fdb45dae8e14

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-146, lines 876–885.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-149.
Source digest: 883d269896b1bdfaf4649b50b44b062956401b2854011fd5c05d18ce42f6fc18
Target digest: 883d269896b1bdfaf4649b50b44b062956401b2854011fd5c05d18ce42f6fc18
Shown source SHA256: 883d269896b1bdfaf4649b50b44b062956401b2854011fd5c05d18ce42f6fc18
Shown target SHA256: 883d269896b1bdfaf4649b50b44b062956401b2854011fd5c05d18ce42f6fc18

### Proposed decision

```json
{
  "claimId": "claim_549c848984871ede1e37fdb45dae8e14",
  "sourceUnitDigest": "883d269896b1bdfaf4649b50b44b062956401b2854011fd5c05d18ce42f6fc18",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-149",
  "targetUnitDigest": "883d269896b1bdfaf4649b50b44b062956401b2854011fd5c05d18ce42f6fc18",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "17. Review Checklist"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-146 (lines 876–885) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-149 (lines 900–909); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
to: "doing"
to:'doing'
expectedStatus: "doing"
expectedStatus:'doing'
awaiting-human -> doing
status === "doing"
statusCategory === "doing"
releaseClaimOnExecuting
```
````

### Full target shown text

````text
```txt
to: "doing"
to:'doing'
expectedStatus: "doing"
expectedStatus:'doing'
awaiting-human -> doing
status === "doing"
statusCategory === "doing"
releaseClaimOnExecuting
```
````

## claim_8417aaebb41017c889b3c5059c58dd46

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-147, lines 887–887.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-150.
Source digest: 77cc1c01840a24182b786ac4efef44450a0bdcf34b5e984d25c0fe3729554a28
Target digest: 77cc1c01840a24182b786ac4efef44450a0bdcf34b5e984d25c0fe3729554a28
Shown source SHA256: 77cc1c01840a24182b786ac4efef44450a0bdcf34b5e984d25c0fe3729554a28
Shown target SHA256: 77cc1c01840a24182b786ac4efef44450a0bdcf34b5e984d25c0fe3729554a28

### Proposed decision

```json
{
  "claimId": "claim_8417aaebb41017c889b3c5059c58dd46",
  "sourceUnitDigest": "77cc1c01840a24182b786ac4efef44450a0bdcf34b5e984d25c0fe3729554a28",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-150",
  "targetUnitDigest": "77cc1c01840a24182b786ac4efef44450a0bdcf34b5e984d25c0fe3729554a28",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "17. Review Checklist"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-147 (lines 887–887) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-150 (lines 911–911); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Each remaining occurrence must be classified as one of:
```

### Full target shown text

```text
Each remaining occurrence must be classified as one of:
```

## claim_90631c632ece2dbe910e89137d0702c6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-148, lines 889–893.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-151.
Source digest: 1b072e4169f1cfa4fa0bec77dc0488fcb7a5c4f6c429affdbe1fe248cc80341c
Target digest: 1b072e4169f1cfa4fa0bec77dc0488fcb7a5c4f6c429affdbe1fe248cc80341c
Shown source SHA256: 1b072e4169f1cfa4fa0bec77dc0488fcb7a5c4f6c429affdbe1fe248cc80341c
Shown target SHA256: 1b072e4169f1cfa4fa0bec77dc0488fcb7a5c4f6c429affdbe1fe248cc80341c

### Proposed decision

```json
{
  "claimId": "claim_90631c632ece2dbe910e89137d0702c6",
  "sourceUnitDigest": "1b072e4169f1cfa4fa0bec77dc0488fcb7a5c4f6c429affdbe1fe248cc80341c",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-151",
  "targetUnitDigest": "1b072e4169f1cfa4fa0bec77dc0488fcb7a5c4f6c429affdbe1fe248cc80341c",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "17. Review Checklist"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-148 (lines 889–893) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-151 (lines 913–917); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- effective status presentation;
- durable attempt history;
- migration code;
- test fixture for old-to-new migration;
- bug.
```

### Full target shown text

```text
- effective status presentation;
- durable attempt history;
- migration code;
- test fixture for old-to-new migration;
- bug.
```

## claim_225afdec641d081a61db5c94adc26782

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-149, lines 895–895.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-152.
Source digest: 77619a501c4f81cfbace208f4a36f1a00bf41dd3f3937217b971bc882f4882c0
Target digest: 77619a501c4f81cfbace208f4a36f1a00bf41dd3f3937217b971bc882f4882c0
Shown source SHA256: 77619a501c4f81cfbace208f4a36f1a00bf41dd3f3937217b971bc882f4882c0
Shown target SHA256: 77619a501c4f81cfbace208f4a36f1a00bf41dd3f3937217b971bc882f4882c0

### Proposed decision

```json
{
  "claimId": "claim_225afdec641d081a61db5c94adc26782",
  "sourceUnitDigest": "77619a501c4f81cfbace208f4a36f1a00bf41dd3f3937217b971bc882f4882c0",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-152",
  "targetUnitDigest": "77619a501c4f81cfbace208f4a36f1a00bf41dd3f3937217b971bc882f4882c0",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "17. Review Checklist"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-149 (lines 895–895) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-152 (lines 919–919); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
No unclassified occurrence should merge.
```

### Full target shown text

```text
No unclassified occurrence should merge.
```

## claim_5edfb25357f127b7865a55ddca1856a3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-150, lines 897–897.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-153.
Source digest: ae74ddfb0ab57a62245acb09ee8d91f9a74292c345ec1489c09bfff1dce7a65e
Target digest: ae74ddfb0ab57a62245acb09ee8d91f9a74292c345ec1489c09bfff1dce7a65e
Shown source SHA256: ae74ddfb0ab57a62245acb09ee8d91f9a74292c345ec1489c09bfff1dce7a65e
Shown target SHA256: ae74ddfb0ab57a62245acb09ee8d91f9a74292c345ec1489c09bfff1dce7a65e

### Proposed decision

```json
{
  "claimId": "claim_5edfb25357f127b7865a55ddca1856a3",
  "sourceUnitDigest": "ae74ddfb0ab57a62245acb09ee8d91f9a74292c345ec1489c09bfff1dce7a65e",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-153",
  "targetUnitDigest": "ae74ddfb0ab57a62245acb09ee8d91f9a74292c345ec1489c09bfff1dce7a65e",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "17. Review Checklist"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-150 (lines 897–897) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-153 (lines 921–921); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Reviewers should also verify every reader that schedules or displays current work reads the effective view, not the durable-only view.
```

### Full target shown text

```text
Reviewers should also verify every reader that schedules or displays current work reads the effective view, not the durable-only view.
```

## claim_36b74fcb1bf1b8bdf3d1f5e79e8ef009

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#18-anti-patterns, lines 899–899.
Target: docs/platform/proposals/doing-coordination-redesign.md#18-anti-patterns.
Source digest: 7806d4e1433e1fb91cdbb3b2466edd68d623e5720e21f55bc67648f6eaaabe5c
Target digest: 7806d4e1433e1fb91cdbb3b2466edd68d623e5720e21f55bc67648f6eaaabe5c
Shown source SHA256: 631a87697bf0a1fdddb7041cea923e154c052410ab007090efe59181269fd8c5
Shown target SHA256: 631a87697bf0a1fdddb7041cea923e154c052410ab007090efe59181269fd8c5

### Proposed decision

```json
{
  "claimId": "claim_36b74fcb1bf1b8bdf3d1f5e79e8ef009",
  "sourceUnitDigest": "7806d4e1433e1fb91cdbb3b2466edd68d623e5720e21f55bc67648f6eaaabe5c",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "18-anti-patterns",
  "targetUnitDigest": "7806d4e1433e1fb91cdbb3b2466edd68d623e5720e21f55bc67648f6eaaabe5c",
  "targetAncestry": [
    "Doing Coordination Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#18-anti-patterns (lines 899–899) is carried at docs/platform/proposals/doing-coordination-redesign.md#18-anti-patterns (lines 923–923); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 18. Anti-Patterns

Do not implement:

- `started` as a current workflow status;
- durable `todo -> doing` at claim acquire;
- durable `awaiting-human -> doing` at answer/resume;
- durable `doing -> todo` at release;
- settle CAS based on durable `doing`;
- anti-loop based on runtime claim files;
- frontier over durable-only state;
- fixed TTL as the primary reclaim mechanism;
- a second independent claim path outside the claim port;
- tracking runtime claim files in git;
- using `state.json` as coordination truth.
```

### Full target shown text

```text
## 18. Anti-Patterns

Do not implement:

- `started` as a current workflow status;
- durable `todo -> doing` at claim acquire;
- durable `awaiting-human -> doing` at answer/resume;
- durable `doing -> todo` at release;
- settle CAS based on durable `doing`;
- anti-loop based on runtime claim files;
- frontier over durable-only state;
- fixed TTL as the primary reclaim mechanism;
- a second independent claim path outside the claim port;
- tracking runtime claim files in git;
- using `state.json` as coordination truth.
```

## claim_5462425ea60fa49e823ba36fa2cc67c3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-151, lines 901–913.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-154.
Source digest: ad3388ec798f2c494de1d0bcf43aab8f7000eeb3bad79fb9c062f2621ac7e7ba
Target digest: ad3388ec798f2c494de1d0bcf43aab8f7000eeb3bad79fb9c062f2621ac7e7ba
Shown source SHA256: ad3388ec798f2c494de1d0bcf43aab8f7000eeb3bad79fb9c062f2621ac7e7ba
Shown target SHA256: ad3388ec798f2c494de1d0bcf43aab8f7000eeb3bad79fb9c062f2621ac7e7ba

### Proposed decision

```json
{
  "claimId": "claim_5462425ea60fa49e823ba36fa2cc67c3",
  "sourceUnitDigest": "ad3388ec798f2c494de1d0bcf43aab8f7000eeb3bad79fb9c062f2621ac7e7ba",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-154",
  "targetUnitDigest": "ad3388ec798f2c494de1d0bcf43aab8f7000eeb3bad79fb9c062f2621ac7e7ba",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "18. Anti-Patterns"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-151 (lines 901–913) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-154 (lines 925–937); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Do not implement:

- `started` as a current workflow status;
- durable `todo -> doing` at claim acquire;
- durable `awaiting-human -> doing` at answer/resume;
- durable `doing -> todo` at release;
- settle CAS based on durable `doing`;
- anti-loop based on runtime claim files;
- frontier over durable-only state;
- fixed TTL as the primary reclaim mechanism;
- a second independent claim path outside the claim port;
- tracking runtime claim files in git;
- using `state.json` as coordination truth.
```

### Full target shown text

```text
Do not implement:

- `started` as a current workflow status;
- durable `todo -> doing` at claim acquire;
- durable `awaiting-human -> doing` at answer/resume;
- durable `doing -> todo` at release;
- settle CAS based on durable `doing`;
- anti-loop based on runtime claim files;
- frontier over durable-only state;
- fixed TTL as the primary reclaim mechanism;
- a second independent claim path outside the claim port;
- tracking runtime claim files in git;
- using `state.json` as coordination truth.
```

## claim_46659f25fc033b76c36765dca3b16ad1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#19-open-design-choices, lines 915–915.
Target: docs/platform/proposals/doing-coordination-redesign.md#19-open-design-choices.
Source digest: 8e760292e6c6d4ece641e8b19a78cb64cc209e7d4bf834f0fbaeee1bcd3afb76
Target digest: 8e760292e6c6d4ece641e8b19a78cb64cc209e7d4bf834f0fbaeee1bcd3afb76
Shown source SHA256: 7fae1e28316996d2fe7d6c389fac75e39ff5e334eeb3b392e2ec1f0e589a8af9
Shown target SHA256: 7fae1e28316996d2fe7d6c389fac75e39ff5e334eeb3b392e2ec1f0e589a8af9

### Proposed decision

```json
{
  "claimId": "claim_46659f25fc033b76c36765dca3b16ad1",
  "sourceUnitDigest": "8e760292e6c6d4ece641e8b19a78cb64cc209e7d4bf834f0fbaeee1bcd3afb76",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "19-open-design-choices",
  "targetUnitDigest": "8e760292e6c6d4ece641e8b19a78cb64cc209e7d4bf834f0fbaeee1bcd3afb76",
  "targetAncestry": [
    "Doing Coordination Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#19-open-design-choices (lines 915–915) is carried at docs/platform/proposals/doing-coordination-redesign.md#19-open-design-choices (lines 939–939); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 19. Open Design Choices

These choices must be made during implementation, but they must not violate the invariants above.

1. Runtime claim file shape:
   - one file per item;
   - one index file with atomic replace;
   - or sharded files by writer/session.

2. Per-item revision identity:
   - monotonically derived item version from replay;
   - last durable event hash touching the item;
   - or a stable fold hash.

3. Attempt event naming:
   - `work.attempt`;
   - `work.run`;
   - or another name if replay and tests make the semantics explicit.

4. Whether open attempts are projected from runtime claims:
   - acceptable as effective-view metadata;
   - not acceptable as durable completed attempt history until settlement/release/reclaim.
```

### Full target shown text

```text
## 19. Open Design Choices

These choices must be made during implementation, but they must not violate the invariants above.

1. Runtime claim file shape:
   - one file per item;
   - one index file with atomic replace;
   - or sharded files by writer/session.

2. Per-item revision identity:
   - monotonically derived item version from replay;
   - last durable event hash touching the item;
   - or a stable fold hash.

3. Attempt event naming:
   - `work.attempt`;
   - `work.run`;
   - or another name if replay and tests make the semantics explicit.

4. Whether open attempts are projected from runtime claims:
   - acceptable as effective-view metadata;
   - not acceptable as durable completed attempt history until settlement/release/reclaim.
```

## claim_c53b8bfca11794f21822c79576cb2ed8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-152, lines 917–917.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-155.
Source digest: ac4264ab88a1c5b267381ef46c3f71f8009e82c60d20c8deb3e1118de5b36c8c
Target digest: ac4264ab88a1c5b267381ef46c3f71f8009e82c60d20c8deb3e1118de5b36c8c
Shown source SHA256: ac4264ab88a1c5b267381ef46c3f71f8009e82c60d20c8deb3e1118de5b36c8c
Shown target SHA256: ac4264ab88a1c5b267381ef46c3f71f8009e82c60d20c8deb3e1118de5b36c8c

### Proposed decision

```json
{
  "claimId": "claim_c53b8bfca11794f21822c79576cb2ed8",
  "sourceUnitDigest": "ac4264ab88a1c5b267381ef46c3f71f8009e82c60d20c8deb3e1118de5b36c8c",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-155",
  "targetUnitDigest": "ac4264ab88a1c5b267381ef46c3f71f8009e82c60d20c8deb3e1118de5b36c8c",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "19. Open Design Choices"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-152 (lines 917–917) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-155 (lines 941–941); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
These choices must be made during implementation, but they must not violate the invariants above.
```

### Full target shown text

```text
These choices must be made during implementation, but they must not violate the invariants above.
```

## claim_4c2525fd0f7d9848aedb0e103d57a4ba

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-153, lines 919–922.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-156.
Source digest: 64ff521b8aa8d8ea99a8af9786506c1fb871443b98036071e4a1e1bd81b038bf
Target digest: 64ff521b8aa8d8ea99a8af9786506c1fb871443b98036071e4a1e1bd81b038bf
Shown source SHA256: 64ff521b8aa8d8ea99a8af9786506c1fb871443b98036071e4a1e1bd81b038bf
Shown target SHA256: 64ff521b8aa8d8ea99a8af9786506c1fb871443b98036071e4a1e1bd81b038bf

### Proposed decision

```json
{
  "claimId": "claim_4c2525fd0f7d9848aedb0e103d57a4ba",
  "sourceUnitDigest": "64ff521b8aa8d8ea99a8af9786506c1fb871443b98036071e4a1e1bd81b038bf",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-156",
  "targetUnitDigest": "64ff521b8aa8d8ea99a8af9786506c1fb871443b98036071e4a1e1bd81b038bf",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "19. Open Design Choices"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-153 (lines 919–922) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-156 (lines 943–946); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
1. Runtime claim file shape:
   - one file per item;
   - one index file with atomic replace;
   - or sharded files by writer/session.
```

### Full target shown text

```text
1. Runtime claim file shape:
   - one file per item;
   - one index file with atomic replace;
   - or sharded files by writer/session.
```

## claim_8ffa24dddbd897a4eee822cbd97888d7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-154, lines 924–927.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-157.
Source digest: 20c64f63a683200c93362538304af8a708a09f07a45b42f6ff4dd184513758d3
Target digest: 20c64f63a683200c93362538304af8a708a09f07a45b42f6ff4dd184513758d3
Shown source SHA256: 20c64f63a683200c93362538304af8a708a09f07a45b42f6ff4dd184513758d3
Shown target SHA256: 20c64f63a683200c93362538304af8a708a09f07a45b42f6ff4dd184513758d3

### Proposed decision

```json
{
  "claimId": "claim_8ffa24dddbd897a4eee822cbd97888d7",
  "sourceUnitDigest": "20c64f63a683200c93362538304af8a708a09f07a45b42f6ff4dd184513758d3",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-157",
  "targetUnitDigest": "20c64f63a683200c93362538304af8a708a09f07a45b42f6ff4dd184513758d3",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "19. Open Design Choices"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-154 (lines 924–927) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-157 (lines 948–951); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
2. Per-item revision identity:
   - monotonically derived item version from replay;
   - last durable event hash touching the item;
   - or a stable fold hash.
```

### Full target shown text

```text
2. Per-item revision identity:
   - monotonically derived item version from replay;
   - last durable event hash touching the item;
   - or a stable fold hash.
```

## claim_a4812a2db40b45fc3faac1c8ef19063d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-155, lines 929–932.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-158.
Source digest: c0762e047ee52c1b02ce45542773486f94368283d6e2103b17a8bc2de200739d
Target digest: c0762e047ee52c1b02ce45542773486f94368283d6e2103b17a8bc2de200739d
Shown source SHA256: c0762e047ee52c1b02ce45542773486f94368283d6e2103b17a8bc2de200739d
Shown target SHA256: c0762e047ee52c1b02ce45542773486f94368283d6e2103b17a8bc2de200739d

### Proposed decision

```json
{
  "claimId": "claim_a4812a2db40b45fc3faac1c8ef19063d",
  "sourceUnitDigest": "c0762e047ee52c1b02ce45542773486f94368283d6e2103b17a8bc2de200739d",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-158",
  "targetUnitDigest": "c0762e047ee52c1b02ce45542773486f94368283d6e2103b17a8bc2de200739d",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "19. Open Design Choices"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-155 (lines 929–932) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-158 (lines 953–956); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
3. Attempt event naming:
   - `work.attempt`;
   - `work.run`;
   - or another name if replay and tests make the semantics explicit.
```

### Full target shown text

```text
3. Attempt event naming:
   - `work.attempt`;
   - `work.run`;
   - or another name if replay and tests make the semantics explicit.
```

## claim_1b5abb0f40e47b5f5821d82a4e6dcf96

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-156, lines 934–936.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-159.
Source digest: ae819aebdd08fa45323a5a4241597abc87f95df1a5e816495f73ca2a21f93462
Target digest: ae819aebdd08fa45323a5a4241597abc87f95df1a5e816495f73ca2a21f93462
Shown source SHA256: ae819aebdd08fa45323a5a4241597abc87f95df1a5e816495f73ca2a21f93462
Shown target SHA256: ae819aebdd08fa45323a5a4241597abc87f95df1a5e816495f73ca2a21f93462

### Proposed decision

```json
{
  "claimId": "claim_1b5abb0f40e47b5f5821d82a4e6dcf96",
  "sourceUnitDigest": "ae819aebdd08fa45323a5a4241597abc87f95df1a5e816495f73ca2a21f93462",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-159",
  "targetUnitDigest": "ae819aebdd08fa45323a5a4241597abc87f95df1a5e816495f73ca2a21f93462",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "19. Open Design Choices"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-156 (lines 934–936) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-159 (lines 958–960); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
4. Whether open attempts are projected from runtime claims:
   - acceptable as effective-view metadata;
   - not acceptable as durable completed attempt history until settlement/release/reclaim.
```

### Full target shown text

```text
4. Whether open attempts are projected from runtime claims:
   - acceptable as effective-view metadata;
   - not acceptable as durable completed attempt history until settlement/release/reclaim.
```

## claim_955ed573b423196a8e5c70748b746582

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#20-summary, lines 938–938.
Target: docs/platform/proposals/doing-coordination-redesign.md#20-summary.
Source digest: 34704a86ec78bb3f0245b4889ea676dbb579281c636d519433a2a1f6a06d59e0
Target digest: 34704a86ec78bb3f0245b4889ea676dbb579281c636d519433a2a1f6a06d59e0
Shown source SHA256: 07772f091e646ac12d37df2857caf82678d01cb51cee828f7a503d4c90c7c946
Shown target SHA256: 07772f091e646ac12d37df2857caf82678d01cb51cee828f7a503d4c90c7c946

### Proposed decision

```json
{
  "claimId": "claim_955ed573b423196a8e5c70748b746582",
  "sourceUnitDigest": "34704a86ec78bb3f0245b4889ea676dbb579281c636d519433a2a1f6a06d59e0",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "20-summary",
  "targetUnitDigest": "34704a86ec78bb3f0245b4889ea676dbb579281c636d519433a2a1f6a06d59e0",
  "targetAncestry": [
    "Doing Coordination Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#20-summary (lines 938–938) is carried at docs/platform/proposals/doing-coordination-redesign.md#20-summary (lines 962–962); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 20. Summary

The redesign does not remove `doing`. It removes claim-time durable `doing`.

Durable state carries workflow truth and attempt history. Runtime coordination carries active ownership. Effective view composes both so users and schedulers can still query `doing`.

This is the only model that preserves all required meanings:

- "not started yet";
- "started before but claimable again";
- "actively being worked";
- "submitted/blocked/final";
- "safe to settle without racing main-checkout claim churn".
```

### Full target shown text

```text
## 20. Summary

The redesign does not remove `doing`. It removes claim-time durable `doing`.

Durable state carries workflow truth and attempt history. Runtime coordination carries active ownership. Effective view composes both so users and schedulers can still query `doing`.

This is the only model that preserves all required meanings:

- "not started yet";
- "started before but claimable again";
- "actively being worked";
- "submitted/blocked/final";
- "safe to settle without racing main-checkout claim churn".
```

## claim_e75b91cc83aee06d30bfd9eb972f1b1e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-157, lines 940–940.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-160.
Source digest: be163c7b7b95113462c291a2a690c9656919be13bf7b5110a625e9965ff3e0c0
Target digest: be163c7b7b95113462c291a2a690c9656919be13bf7b5110a625e9965ff3e0c0
Shown source SHA256: be163c7b7b95113462c291a2a690c9656919be13bf7b5110a625e9965ff3e0c0
Shown target SHA256: be163c7b7b95113462c291a2a690c9656919be13bf7b5110a625e9965ff3e0c0

### Proposed decision

```json
{
  "claimId": "claim_e75b91cc83aee06d30bfd9eb972f1b1e",
  "sourceUnitDigest": "be163c7b7b95113462c291a2a690c9656919be13bf7b5110a625e9965ff3e0c0",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-160",
  "targetUnitDigest": "be163c7b7b95113462c291a2a690c9656919be13bf7b5110a625e9965ff3e0c0",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "20. Summary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-157 (lines 940–940) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-160 (lines 964–964); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The redesign does not remove `doing`. It removes claim-time durable `doing`.
```

### Full target shown text

```text
The redesign does not remove `doing`. It removes claim-time durable `doing`.
```

## claim_74459314cad86073d2d09154117766b0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-158, lines 942–942.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-161.
Source digest: 2e820bede13d82e2fe02dc058d9e069f211a1b9d44a7919186d957cf3e0a04db
Target digest: 2e820bede13d82e2fe02dc058d9e069f211a1b9d44a7919186d957cf3e0a04db
Shown source SHA256: 2e820bede13d82e2fe02dc058d9e069f211a1b9d44a7919186d957cf3e0a04db
Shown target SHA256: 2e820bede13d82e2fe02dc058d9e069f211a1b9d44a7919186d957cf3e0a04db

### Proposed decision

```json
{
  "claimId": "claim_74459314cad86073d2d09154117766b0",
  "sourceUnitDigest": "2e820bede13d82e2fe02dc058d9e069f211a1b9d44a7919186d957cf3e0a04db",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-161",
  "targetUnitDigest": "2e820bede13d82e2fe02dc058d9e069f211a1b9d44a7919186d957cf3e0a04db",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "20. Summary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-158 (lines 942–942) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-161 (lines 966–966); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Durable state carries workflow truth and attempt history. Runtime coordination carries active ownership. Effective view composes both so users and schedulers can still query `doing`.
```

### Full target shown text

```text
Durable state carries workflow truth and attempt history. Runtime coordination carries active ownership. Effective view composes both so users and schedulers can still query `doing`.
```

## claim_dae1506f5f0c226b9b5e2dc0d589f5a0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-159, lines 944–944.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-162.
Source digest: e16df663f35e5fa75b5448d61638d6299c9218cc58abfcb951e8dc15ceb7f5b8
Target digest: e16df663f35e5fa75b5448d61638d6299c9218cc58abfcb951e8dc15ceb7f5b8
Shown source SHA256: e16df663f35e5fa75b5448d61638d6299c9218cc58abfcb951e8dc15ceb7f5b8
Shown target SHA256: e16df663f35e5fa75b5448d61638d6299c9218cc58abfcb951e8dc15ceb7f5b8

### Proposed decision

```json
{
  "claimId": "claim_dae1506f5f0c226b9b5e2dc0d589f5a0",
  "sourceUnitDigest": "e16df663f35e5fa75b5448d61638d6299c9218cc58abfcb951e8dc15ceb7f5b8",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-162",
  "targetUnitDigest": "e16df663f35e5fa75b5448d61638d6299c9218cc58abfcb951e8dc15ceb7f5b8",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "20. Summary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-159 (lines 944–944) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-162 (lines 968–968); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
This is the only model that preserves all required meanings:
```

### Full target shown text

```text
This is the only model that preserves all required meanings:
```

## claim_8dca8112a9de6b7d75c9faca6f74a47d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-160, lines 946–950.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-163.
Source digest: f882ed0d3fb823d745f0f4129c13d304ec8418c1d33ca5c834d8db96090a2f63
Target digest: f882ed0d3fb823d745f0f4129c13d304ec8418c1d33ca5c834d8db96090a2f63
Shown source SHA256: f882ed0d3fb823d745f0f4129c13d304ec8418c1d33ca5c834d8db96090a2f63
Shown target SHA256: f882ed0d3fb823d745f0f4129c13d304ec8418c1d33ca5c834d8db96090a2f63

### Proposed decision

```json
{
  "claimId": "claim_8dca8112a9de6b7d75c9faca6f74a47d",
  "sourceUnitDigest": "f882ed0d3fb823d745f0f4129c13d304ec8418c1d33ca5c834d8db96090a2f63",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-163",
  "targetUnitDigest": "f882ed0d3fb823d745f0f4129c13d304ec8418c1d33ca5c834d8db96090a2f63",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "20. Summary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-160 (lines 946–950) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-163 (lines 970–974); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- "not started yet";
- "started before but claimable again";
- "actively being worked";
- "submitted/blocked/final";
- "safe to settle without racing main-checkout claim churn".
```

### Full target shown text

```text
- "not started yet";
- "started before but claimable again";
- "actively being worked";
- "submitted/blocked/final";
- "safe to settle without racing main-checkout claim churn".
```

## claim_3de63efc3d9d7482f33a966e87f43244

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#21-implementation-pointers, lines 952–952.
Target: docs/platform/proposals/doing-coordination-redesign.md#21-implementation-pointers.
Source digest: 8a38850487713dda7f6f1a981e1a176cea94e37ec6cf00365acb1bdfe24236ba
Target digest: 8a38850487713dda7f6f1a981e1a176cea94e37ec6cf00365acb1bdfe24236ba
Shown source SHA256: 744a5a744bd1eabe3720194485239757cf27f797c865e0fef98ef3a81e85f7b3
Shown target SHA256: 744a5a744bd1eabe3720194485239757cf27f797c865e0fef98ef3a81e85f7b3

### Proposed decision

```json
{
  "claimId": "claim_3de63efc3d9d7482f33a966e87f43244",
  "sourceUnitDigest": "8a38850487713dda7f6f1a981e1a176cea94e37ec6cf00365acb1bdfe24236ba",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "21-implementation-pointers",
  "targetUnitDigest": "8a38850487713dda7f6f1a981e1a176cea94e37ec6cf00365acb1bdfe24236ba",
  "targetAncestry": [
    "Doing Coordination Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#21-implementation-pointers (lines 952–952) is carried at docs/platform/proposals/doing-coordination-redesign.md#21-implementation-pointers (lines 976–976); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 21. Implementation Pointers

Real files this redesign landed in, found by scanning the `tsk-40m` / `tsk-1sl` /
`tsk-1ht` commit ranges (`git show --stat`) below. Files touched only as
incidental test-fixture updates (many `test/cli/fgos-*.test.mjs` files needed
their CAS-base assertions adjusted once claim-time no longer writes durable
`doing`) are grouped at the end instead of listed individually.

Core module-boundary files (§8):

- `src/state/runtime-coordination.mjs` — new; owns the runtime coordination
  store from §8.1 (acquire/read/release/reclaim active claims).
- `src/state/store.mjs` — durable store module (§8.2): `settleClaim`,
  attempt-event append, revision/CAS validation.
- `src/state/status-fsm.mjs` — durable FSM edges; removes normal `-> doing`
  claim-acquire edges per §6.1/§6.3.
- `src/state/replay.mjs` — projects `attemptCount`/`hasStarted`/`lastAttempt`
  (§6.3, §7.2) into the derived durable view.
- `src/runner/claim-port.mjs` — the claim port (§8.4): the single choke point
  for claim acquire/settle/release/reclaim.
- `src/runner/anti-loop.mjs` — switched to counting `work.attempt` events
  instead of `work.move -> doing` (§13).
- `src/runner/loop.mjs` — driving loop reads/writes through the effective
  view and runtime claims.
- `src/runner/merge.mjs`, `src/runner/worktree.mjs` — settle/merge and
  worktree-prep paths updated for the new claim data model.
- `src/intake/discovery.mjs`, `src/intake/plan.mjs` — planning/discovery
  claim-lock behavior for §9.6 (planning to executing).
- `src/state/fgos-file-registry.mjs`, `src/state/cleanup-harness.mjs` —
  register/ignore the new runtime coordination file class (§10.2).
- `src/cli/command-registry.mjs`, `bin/fgos.mjs` — CLI wiring for the new
  claim/settle/list surfaces.
- `docs/architecture-manifest.json` — module registration.

Focused tests:

- `test/state/runtime-coordination.test.mjs` — new; unit coverage for the
  runtime coordination store itself.
- `test/state/store.test.mjs`, `test/state/fsm.test.mjs`,
  `test/state/awaiting.test.mjs`, `test/state/replay.test.mjs`,
  `test/state/status-category.test.mjs`, `test/state/worker-slots.test.mjs`,
  `test/state/compound-learn-done-gate.test.mjs`,
  `test/state/retrospective-doors.test.mjs`
- `test/runner/claim-port.test.mjs`, `test/runner/loop.test.mjs`,
  `test/runner/anti-loop.test.mjs`,
  `test/runner/concurrent-claim-eventlog-loss.test.mjs`
- `test/intake/discovery.test.mjs`, `test/intake/plan.test.mjs`

Repo-wide fixture churn (CAS-base and status-assertion updates only, not new
behavior of their own): most of `test/cli/fgos-*.test.mjs` (claim, claim-2,
edit, handoff, intake, intake-4, iron-law-gate, merge, merge-2, move,
post-merge, post-merge-4, read, read-4, read-5, return, return-2, return-3,
setup, stage-3, take-pick-claim-eligibility, `helpers/fgos-cli-harness.mjs`)
and `test/e2e/{fixture-marketing-domain,rebuild-determinism,runner-loop,
synthetic-domain}.test.mjs`.

Decision/history anchor: `docs/history/runtime-claim-doing-separation/`
(CONTEXT.md/plan.md/RESEARCH.md/iron-law-evidence.md).
```

### Full target shown text

```text
## 21. Implementation Pointers

Real files this redesign landed in, found by scanning the `tsk-40m` / `tsk-1sl` /
`tsk-1ht` commit ranges (`git show --stat`) below. Files touched only as
incidental test-fixture updates (many `test/cli/fgos-*.test.mjs` files needed
their CAS-base assertions adjusted once claim-time no longer writes durable
`doing`) are grouped at the end instead of listed individually.

Core module-boundary files (§8):

- `src/state/runtime-coordination.mjs` — new; owns the runtime coordination
  store from §8.1 (acquire/read/release/reclaim active claims).
- `src/state/store.mjs` — durable store module (§8.2): `settleClaim`,
  attempt-event append, revision/CAS validation.
- `src/state/status-fsm.mjs` — durable FSM edges; removes normal `-> doing`
  claim-acquire edges per §6.1/§6.3.
- `src/state/replay.mjs` — projects `attemptCount`/`hasStarted`/`lastAttempt`
  (§6.3, §7.2) into the derived durable view.
- `src/runner/claim-port.mjs` — the claim port (§8.4): the single choke point
  for claim acquire/settle/release/reclaim.
- `src/runner/anti-loop.mjs` — switched to counting `work.attempt` events
  instead of `work.move -> doing` (§13).
- `src/runner/loop.mjs` — driving loop reads/writes through the effective
  view and runtime claims.
- `src/runner/merge.mjs`, `src/runner/worktree.mjs` — settle/merge and
  worktree-prep paths updated for the new claim data model.
- `src/intake/discovery.mjs`, `src/intake/plan.mjs` — planning/discovery
  claim-lock behavior for §9.6 (planning to executing).
- `src/state/fgos-file-registry.mjs`, `src/state/cleanup-harness.mjs` —
  register/ignore the new runtime coordination file class (§10.2).
- `src/cli/command-registry.mjs`, `bin/fgos.mjs` — CLI wiring for the new
  claim/settle/list surfaces.
- `docs/architecture-manifest.json` — module registration.

Focused tests:

- `test/state/runtime-coordination.test.mjs` — new; unit coverage for the
  runtime coordination store itself.
- `test/state/store.test.mjs`, `test/state/fsm.test.mjs`,
  `test/state/awaiting.test.mjs`, `test/state/replay.test.mjs`,
  `test/state/status-category.test.mjs`, `test/state/worker-slots.test.mjs`,
  `test/state/compound-learn-done-gate.test.mjs`,
  `test/state/retrospective-doors.test.mjs`
- `test/runner/claim-port.test.mjs`, `test/runner/loop.test.mjs`,
  `test/runner/anti-loop.test.mjs`,
  `test/runner/concurrent-claim-eventlog-loss.test.mjs`
- `test/intake/discovery.test.mjs`, `test/intake/plan.test.mjs`

Repo-wide fixture churn (CAS-base and status-assertion updates only, not new
behavior of their own): most of `test/cli/fgos-*.test.mjs` (claim, claim-2,
edit, handoff, intake, intake-4, iron-law-gate, merge, merge-2, move,
post-merge, post-merge-4, read, read-4, read-5, return, return-2, return-3,
setup, stage-3, take-pick-claim-eligibility, `helpers/fgos-cli-harness.mjs`)
and `test/e2e/{fixture-marketing-domain,rebuild-determinism,runner-loop,
synthetic-domain}.test.mjs`.

Decision/history anchor: `docs/history/runtime-claim-doing-separation/`
(CONTEXT.md/plan.md/RESEARCH.md/iron-law-evidence.md).
```

## claim_ecdf3edd0a7324dce7393c5faebdd44a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-161, lines 954–958.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-164.
Source digest: fb0af79f4732417214e0f820d8293ee146c70939e4ba041a96c52bc9e7488f60
Target digest: fb0af79f4732417214e0f820d8293ee146c70939e4ba041a96c52bc9e7488f60
Shown source SHA256: fb0af79f4732417214e0f820d8293ee146c70939e4ba041a96c52bc9e7488f60
Shown target SHA256: fb0af79f4732417214e0f820d8293ee146c70939e4ba041a96c52bc9e7488f60

### Proposed decision

```json
{
  "claimId": "claim_ecdf3edd0a7324dce7393c5faebdd44a",
  "sourceUnitDigest": "fb0af79f4732417214e0f820d8293ee146c70939e4ba041a96c52bc9e7488f60",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-164",
  "targetUnitDigest": "fb0af79f4732417214e0f820d8293ee146c70939e4ba041a96c52bc9e7488f60",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "21. Implementation Pointers"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-161 (lines 954–958) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-164 (lines 978–982); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Real files this redesign landed in, found by scanning the `tsk-40m` / `tsk-1sl` /
`tsk-1ht` commit ranges (`git show --stat`) below. Files touched only as
incidental test-fixture updates (many `test/cli/fgos-*.test.mjs` files needed
their CAS-base assertions adjusted once claim-time no longer writes durable
`doing`) are grouped at the end instead of listed individually.
```

### Full target shown text

```text
Real files this redesign landed in, found by scanning the `tsk-40m` / `tsk-1sl` /
`tsk-1ht` commit ranges (`git show --stat`) below. Files touched only as
incidental test-fixture updates (many `test/cli/fgos-*.test.mjs` files needed
their CAS-base assertions adjusted once claim-time no longer writes durable
`doing`) are grouped at the end instead of listed individually.
```

## claim_66f859e88bb2ff67b885291b81405ca8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-162, lines 960–960.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-165.
Source digest: ab26b774058a8161f4ed1da6c700de6e9095fc6f0cd4a5e830c93244423e2070
Target digest: ab26b774058a8161f4ed1da6c700de6e9095fc6f0cd4a5e830c93244423e2070
Shown source SHA256: ab26b774058a8161f4ed1da6c700de6e9095fc6f0cd4a5e830c93244423e2070
Shown target SHA256: ab26b774058a8161f4ed1da6c700de6e9095fc6f0cd4a5e830c93244423e2070

### Proposed decision

```json
{
  "claimId": "claim_66f859e88bb2ff67b885291b81405ca8",
  "sourceUnitDigest": "ab26b774058a8161f4ed1da6c700de6e9095fc6f0cd4a5e830c93244423e2070",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-165",
  "targetUnitDigest": "ab26b774058a8161f4ed1da6c700de6e9095fc6f0cd4a5e830c93244423e2070",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "21. Implementation Pointers"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-162 (lines 960–960) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-165 (lines 984–984); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Core module-boundary files (§8):
```

### Full target shown text

```text
Core module-boundary files (§8):
```

## claim_475c31465af43062b9aaa8f7d885dba5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-163, lines 962–984.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-166.
Source digest: 4f76bff71a424b584d46beba7fa662975d52a4cb68b88d94cf603e7d18f8087c
Target digest: 4f76bff71a424b584d46beba7fa662975d52a4cb68b88d94cf603e7d18f8087c
Shown source SHA256: 4f76bff71a424b584d46beba7fa662975d52a4cb68b88d94cf603e7d18f8087c
Shown target SHA256: 4f76bff71a424b584d46beba7fa662975d52a4cb68b88d94cf603e7d18f8087c

### Proposed decision

```json
{
  "claimId": "claim_475c31465af43062b9aaa8f7d885dba5",
  "sourceUnitDigest": "4f76bff71a424b584d46beba7fa662975d52a4cb68b88d94cf603e7d18f8087c",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-166",
  "targetUnitDigest": "4f76bff71a424b584d46beba7fa662975d52a4cb68b88d94cf603e7d18f8087c",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "21. Implementation Pointers"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-163 (lines 962–984) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-166 (lines 986–1008); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- `src/state/runtime-coordination.mjs` — new; owns the runtime coordination
  store from §8.1 (acquire/read/release/reclaim active claims).
- `src/state/store.mjs` — durable store module (§8.2): `settleClaim`,
  attempt-event append, revision/CAS validation.
- `src/state/status-fsm.mjs` — durable FSM edges; removes normal `-> doing`
  claim-acquire edges per §6.1/§6.3.
- `src/state/replay.mjs` — projects `attemptCount`/`hasStarted`/`lastAttempt`
  (§6.3, §7.2) into the derived durable view.
- `src/runner/claim-port.mjs` — the claim port (§8.4): the single choke point
  for claim acquire/settle/release/reclaim.
- `src/runner/anti-loop.mjs` — switched to counting `work.attempt` events
  instead of `work.move -> doing` (§13).
- `src/runner/loop.mjs` — driving loop reads/writes through the effective
  view and runtime claims.
- `src/runner/merge.mjs`, `src/runner/worktree.mjs` — settle/merge and
  worktree-prep paths updated for the new claim data model.
- `src/intake/discovery.mjs`, `src/intake/plan.mjs` — planning/discovery
  claim-lock behavior for §9.6 (planning to executing).
- `src/state/fgos-file-registry.mjs`, `src/state/cleanup-harness.mjs` —
  register/ignore the new runtime coordination file class (§10.2).
- `src/cli/command-registry.mjs`, `bin/fgos.mjs` — CLI wiring for the new
  claim/settle/list surfaces.
- `docs/architecture-manifest.json` — module registration.
```

### Full target shown text

```text
- `src/state/runtime-coordination.mjs` — new; owns the runtime coordination
  store from §8.1 (acquire/read/release/reclaim active claims).
- `src/state/store.mjs` — durable store module (§8.2): `settleClaim`,
  attempt-event append, revision/CAS validation.
- `src/state/status-fsm.mjs` — durable FSM edges; removes normal `-> doing`
  claim-acquire edges per §6.1/§6.3.
- `src/state/replay.mjs` — projects `attemptCount`/`hasStarted`/`lastAttempt`
  (§6.3, §7.2) into the derived durable view.
- `src/runner/claim-port.mjs` — the claim port (§8.4): the single choke point
  for claim acquire/settle/release/reclaim.
- `src/runner/anti-loop.mjs` — switched to counting `work.attempt` events
  instead of `work.move -> doing` (§13).
- `src/runner/loop.mjs` — driving loop reads/writes through the effective
  view and runtime claims.
- `src/runner/merge.mjs`, `src/runner/worktree.mjs` — settle/merge and
  worktree-prep paths updated for the new claim data model.
- `src/intake/discovery.mjs`, `src/intake/plan.mjs` — planning/discovery
  claim-lock behavior for §9.6 (planning to executing).
- `src/state/fgos-file-registry.mjs`, `src/state/cleanup-harness.mjs` —
  register/ignore the new runtime coordination file class (§10.2).
- `src/cli/command-registry.mjs`, `bin/fgos.mjs` — CLI wiring for the new
  claim/settle/list surfaces.
- `docs/architecture-manifest.json` — module registration.
```

## claim_90f40488ec382772e5a05654d9b4110d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-164, lines 986–998.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-167.
Source digest: fb32a3e68b3d90c2bdfb1d5d65c947257ee15b7f226ab75f24a20e567f7596ed
Target digest: fb32a3e68b3d90c2bdfb1d5d65c947257ee15b7f226ab75f24a20e567f7596ed
Shown source SHA256: fb32a3e68b3d90c2bdfb1d5d65c947257ee15b7f226ab75f24a20e567f7596ed
Shown target SHA256: fb32a3e68b3d90c2bdfb1d5d65c947257ee15b7f226ab75f24a20e567f7596ed

### Proposed decision

```json
{
  "claimId": "claim_90f40488ec382772e5a05654d9b4110d",
  "sourceUnitDigest": "fb32a3e68b3d90c2bdfb1d5d65c947257ee15b7f226ab75f24a20e567f7596ed",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-167",
  "targetUnitDigest": "fb32a3e68b3d90c2bdfb1d5d65c947257ee15b7f226ab75f24a20e567f7596ed",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "21. Implementation Pointers"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-164 (lines 986–998) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-167 (lines 1010–1022); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Focused tests:

- `test/state/runtime-coordination.test.mjs` — new; unit coverage for the
  runtime coordination store itself.
- `test/state/store.test.mjs`, `test/state/fsm.test.mjs`,
  `test/state/awaiting.test.mjs`, `test/state/replay.test.mjs`,
  `test/state/status-category.test.mjs`, `test/state/worker-slots.test.mjs`,
  `test/state/compound-learn-done-gate.test.mjs`,
  `test/state/retrospective-doors.test.mjs`
- `test/runner/claim-port.test.mjs`, `test/runner/loop.test.mjs`,
  `test/runner/anti-loop.test.mjs`,
  `test/runner/concurrent-claim-eventlog-loss.test.mjs`
- `test/intake/discovery.test.mjs`, `test/intake/plan.test.mjs`
```

### Full target shown text

```text
Focused tests:

- `test/state/runtime-coordination.test.mjs` — new; unit coverage for the
  runtime coordination store itself.
- `test/state/store.test.mjs`, `test/state/fsm.test.mjs`,
  `test/state/awaiting.test.mjs`, `test/state/replay.test.mjs`,
  `test/state/status-category.test.mjs`, `test/state/worker-slots.test.mjs`,
  `test/state/compound-learn-done-gate.test.mjs`,
  `test/state/retrospective-doors.test.mjs`
- `test/runner/claim-port.test.mjs`, `test/runner/loop.test.mjs`,
  `test/runner/anti-loop.test.mjs`,
  `test/runner/concurrent-claim-eventlog-loss.test.mjs`
- `test/intake/discovery.test.mjs`, `test/intake/plan.test.mjs`
```

## claim_3a657d706f5f6d581c091dac4e51a3c8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-165, lines 1000–1006.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-168.
Source digest: 6f59a8e1638bd9952a08e3a9c7d58d6de6ad47d564372ef5c71b576f3f4edb33
Target digest: 6f59a8e1638bd9952a08e3a9c7d58d6de6ad47d564372ef5c71b576f3f4edb33
Shown source SHA256: 6f59a8e1638bd9952a08e3a9c7d58d6de6ad47d564372ef5c71b576f3f4edb33
Shown target SHA256: 6f59a8e1638bd9952a08e3a9c7d58d6de6ad47d564372ef5c71b576f3f4edb33

### Proposed decision

```json
{
  "claimId": "claim_3a657d706f5f6d581c091dac4e51a3c8",
  "sourceUnitDigest": "6f59a8e1638bd9952a08e3a9c7d58d6de6ad47d564372ef5c71b576f3f4edb33",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-168",
  "targetUnitDigest": "6f59a8e1638bd9952a08e3a9c7d58d6de6ad47d564372ef5c71b576f3f4edb33",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "21. Implementation Pointers"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-165 (lines 1000–1006) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-168 (lines 1024–1030); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Repo-wide fixture churn (CAS-base and status-assertion updates only, not new
behavior of their own): most of `test/cli/fgos-*.test.mjs` (claim, claim-2,
edit, handoff, intake, intake-4, iron-law-gate, merge, merge-2, move,
post-merge, post-merge-4, read, read-4, read-5, return, return-2, return-3,
setup, stage-3, take-pick-claim-eligibility, `helpers/fgos-cli-harness.mjs`)
and `test/e2e/{fixture-marketing-domain,rebuild-determinism,runner-loop,
synthetic-domain}.test.mjs`.
```

### Full target shown text

```text
Repo-wide fixture churn (CAS-base and status-assertion updates only, not new
behavior of their own): most of `test/cli/fgos-*.test.mjs` (claim, claim-2,
edit, handoff, intake, intake-4, iron-law-gate, merge, merge-2, move,
post-merge, post-merge-4, read, read-4, read-5, return, return-2, return-3,
setup, stage-3, take-pick-claim-eligibility, `helpers/fgos-cli-harness.mjs`)
and `test/e2e/{fixture-marketing-domain,rebuild-determinism,runner-loop,
synthetic-domain}.test.mjs`.
```

## claim_f7730a52800e9369a8ede04ad1809829

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-166, lines 1008–1009.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-169.
Source digest: 5db5697073e6eb5b185e8d47b2dea5731241a0eee0de8357e8602ed2c190402a
Target digest: 5db5697073e6eb5b185e8d47b2dea5731241a0eee0de8357e8602ed2c190402a
Shown source SHA256: 5db5697073e6eb5b185e8d47b2dea5731241a0eee0de8357e8602ed2c190402a
Shown target SHA256: 5db5697073e6eb5b185e8d47b2dea5731241a0eee0de8357e8602ed2c190402a

### Proposed decision

```json
{
  "claimId": "claim_f7730a52800e9369a8ede04ad1809829",
  "sourceUnitDigest": "5db5697073e6eb5b185e8d47b2dea5731241a0eee0de8357e8602ed2c190402a",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-169",
  "targetUnitDigest": "5db5697073e6eb5b185e8d47b2dea5731241a0eee0de8357e8602ed2c190402a",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "21. Implementation Pointers"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-166 (lines 1008–1009) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-169 (lines 1032–1033); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Decision/history anchor: `docs/history/runtime-claim-doing-separation/`
(CONTEXT.md/plan.md/RESEARCH.md/iron-law-evidence.md).
```

### Full target shown text

```text
Decision/history anchor: `docs/history/runtime-claim-doing-separation/`
(CONTEXT.md/plan.md/RESEARCH.md/iron-law-evidence.md).
```

## claim_49eef7094aace54e07bb22bedba7d856

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#22-implementation-tasks, lines 1011–1011.
Target: docs/platform/proposals/doing-coordination-redesign.md#22-implementation-tasks.
Source digest: 76984f5a50f52db6718bb0707edc1881ad89e93d6678965285c00d0f90386efa
Target digest: 76984f5a50f52db6718bb0707edc1881ad89e93d6678965285c00d0f90386efa
Shown source SHA256: d2c2f28ad289960c3ced22580337156b5d04538c32e295e2094e74ba253d4f3b
Shown target SHA256: d2c2f28ad289960c3ced22580337156b5d04538c32e295e2094e74ba253d4f3b

### Proposed decision

```json
{
  "claimId": "claim_49eef7094aace54e07bb22bedba7d856",
  "sourceUnitDigest": "76984f5a50f52db6718bb0707edc1881ad89e93d6678965285c00d0f90386efa",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "22-implementation-tasks",
  "targetUnitDigest": "76984f5a50f52db6718bb0707edc1881ad89e93d6678965285c00d0f90386efa",
  "targetAncestry": [
    "Doing Coordination Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#22-implementation-tasks (lines 1011–1011) is carried at docs/platform/proposals/doing-coordination-redesign.md#22-implementation-tasks (lines 1035–1035); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 22. Implementation Tasks

Single work item, delivered 2026-08-25, no decomposed children (decompose
verdict: pass-through, one indivisible piece — every mechanism below had to
land in the same claim or the system would break mid-migration):

- **tsk-40m** — Tách live claim/doing khỏi durable eventlog (mergedInto
  `main`, mergedSha `401a2282ee381b5c2831e6f4d7538e834ada6503`).

Commits, in landing order (all 2026-08-25):

1. `7dffb476` docs(tsk-40m): lock exploring decisions for runtime-claim/doing separation (D1-D6)
2. `6c3cfe40` docs(tsk-40m): write plan.md for runtime-claim/doing separation
3. `7c4c4a13` refactor(runner): separate live claim/doing from durable eventlog (tsk-40m)
4. `a152af34` docs(tsk-40m): Iron Law evidence for runtime-claim/doing separation
5. `9f94e847` fix(tsk-40m): close claim/settle correctness gaps found in code review
6. `3a59ac68` docs(tsk-40m): correct stale releaseClaimOnExecuting wording
7. `5f2e12b7` fix(tsk-40m): close round-2 claim/settle gaps found in follow-up code review
8. `27d47bce` feat(tsk-40m): enforce writer-identity ownership on settleClaim
9. `3d6c0044` fix(tsk-40m): close settleClaim's TOCTOU race on the write lock
10. `2e43ce3e` fix(tsk-40m): close settleClaim atomicity + release-timing gaps
11. `afc4d3dd` fix(tsk-40m): settleClaim returns the raw final event, not a nested one
12. `012af034` feat(tsk-40m): settle claim time directly to finalStatus, drop durable doing
13. `e4d269bf` fix(tsk-40m): stop ask/answer from ever writing durable doing (P1)
14. `835f162e` fix(tsk-40m): anti-loop hard-cut per locked D3, supersede stale plan.md
15. `860852fb` docs(tsk-40m): fix stale answerAwaiting comment on claim un-stale fringe case

Follow-up verification/fix tasks, delivered 2026-08-26 (day after, not part
of the original deployment batch above, but closing gaps this redesign left):

- **tsk-1sl** — §17 review-checklist + §15 acceptance-criteria re-audit against
  real `src/` state; confirmed clean, flipped this doc's status header
  (mergedSha `e7a799207165bb0ffb4a9d5dd02e4034e7f49d11`).
- **tsk-1ht** — `settleClaim`'s revision-CAS check had no reconcile path for a
  claim-holder's own mid-lifecycle edits (§16.3 gap noted in this doc's status
  header at the time); fixed and delivered (mergedSha
  `5f818ee63c3b62abaab721ca28e46613f7ebf76a`). The status-header note above
  describing this as an open gap is now stale — kept as written since fixing
  the gap is a separate item's job, not this doc-history append's.
```

### Full target shown text

```text
## 22. Implementation Tasks

Single work item, delivered 2026-08-25, no decomposed children (decompose
verdict: pass-through, one indivisible piece — every mechanism below had to
land in the same claim or the system would break mid-migration):

- **tsk-40m** — Tách live claim/doing khỏi durable eventlog (mergedInto
  `main`, mergedSha `401a2282ee381b5c2831e6f4d7538e834ada6503`).

Commits, in landing order (all 2026-08-25):

1. `7dffb476` docs(tsk-40m): lock exploring decisions for runtime-claim/doing separation (D1-D6)
2. `6c3cfe40` docs(tsk-40m): write plan.md for runtime-claim/doing separation
3. `7c4c4a13` refactor(runner): separate live claim/doing from durable eventlog (tsk-40m)
4. `a152af34` docs(tsk-40m): Iron Law evidence for runtime-claim/doing separation
5. `9f94e847` fix(tsk-40m): close claim/settle correctness gaps found in code review
6. `3a59ac68` docs(tsk-40m): correct stale releaseClaimOnExecuting wording
7. `5f2e12b7` fix(tsk-40m): close round-2 claim/settle gaps found in follow-up code review
8. `27d47bce` feat(tsk-40m): enforce writer-identity ownership on settleClaim
9. `3d6c0044` fix(tsk-40m): close settleClaim's TOCTOU race on the write lock
10. `2e43ce3e` fix(tsk-40m): close settleClaim atomicity + release-timing gaps
11. `afc4d3dd` fix(tsk-40m): settleClaim returns the raw final event, not a nested one
12. `012af034` feat(tsk-40m): settle claim time directly to finalStatus, drop durable doing
13. `e4d269bf` fix(tsk-40m): stop ask/answer from ever writing durable doing (P1)
14. `835f162e` fix(tsk-40m): anti-loop hard-cut per locked D3, supersede stale plan.md
15. `860852fb` docs(tsk-40m): fix stale answerAwaiting comment on claim un-stale fringe case

Follow-up verification/fix tasks, delivered 2026-08-26 (day after, not part
of the original deployment batch above, but closing gaps this redesign left):

- **tsk-1sl** — §17 review-checklist + §15 acceptance-criteria re-audit against
  real `src/` state; confirmed clean, flipped this doc's status header
  (mergedSha `e7a799207165bb0ffb4a9d5dd02e4034e7f49d11`).
- **tsk-1ht** — `settleClaim`'s revision-CAS check had no reconcile path for a
  claim-holder's own mid-lifecycle edits (§16.3 gap noted in this doc's status
  header at the time); fixed and delivered (mergedSha
  `5f818ee63c3b62abaab721ca28e46613f7ebf76a`). The status-header note above
  describing this as an open gap is now stale — kept as written since fixing
  the gap is a separate item's job, not this doc-history append's.
```

## claim_5547af37e63e0060820a9c0ec73062e2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-167, lines 1013–1015.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-170.
Source digest: 01bbcb8219802d32d5e914624dd3fb0f06567a0fd3a9082aa74eed7b828a5317
Target digest: 01bbcb8219802d32d5e914624dd3fb0f06567a0fd3a9082aa74eed7b828a5317
Shown source SHA256: 01bbcb8219802d32d5e914624dd3fb0f06567a0fd3a9082aa74eed7b828a5317
Shown target SHA256: 01bbcb8219802d32d5e914624dd3fb0f06567a0fd3a9082aa74eed7b828a5317

### Proposed decision

```json
{
  "claimId": "claim_5547af37e63e0060820a9c0ec73062e2",
  "sourceUnitDigest": "01bbcb8219802d32d5e914624dd3fb0f06567a0fd3a9082aa74eed7b828a5317",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-170",
  "targetUnitDigest": "01bbcb8219802d32d5e914624dd3fb0f06567a0fd3a9082aa74eed7b828a5317",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "22. Implementation Tasks"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-167 (lines 1013–1015) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-170 (lines 1037–1039); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Single work item, delivered 2026-08-25, no decomposed children (decompose
verdict: pass-through, one indivisible piece — every mechanism below had to
land in the same claim or the system would break mid-migration):
```

### Full target shown text

```text
Single work item, delivered 2026-08-25, no decomposed children (decompose
verdict: pass-through, one indivisible piece — every mechanism below had to
land in the same claim or the system would break mid-migration):
```

## claim_afbb847f817d497e4aa6f57df881f47a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-168, lines 1017–1018.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-171.
Source digest: 86ddc12acd0a666f4dad66b0260cc683a3f1b4446ca4d7555b496f0739aa47e5
Target digest: 86ddc12acd0a666f4dad66b0260cc683a3f1b4446ca4d7555b496f0739aa47e5
Shown source SHA256: 86ddc12acd0a666f4dad66b0260cc683a3f1b4446ca4d7555b496f0739aa47e5
Shown target SHA256: 86ddc12acd0a666f4dad66b0260cc683a3f1b4446ca4d7555b496f0739aa47e5

### Proposed decision

```json
{
  "claimId": "claim_afbb847f817d497e4aa6f57df881f47a",
  "sourceUnitDigest": "86ddc12acd0a666f4dad66b0260cc683a3f1b4446ca4d7555b496f0739aa47e5",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-171",
  "targetUnitDigest": "86ddc12acd0a666f4dad66b0260cc683a3f1b4446ca4d7555b496f0739aa47e5",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "22. Implementation Tasks"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-168 (lines 1017–1018) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-171 (lines 1041–1042); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- **tsk-40m** — Tách live claim/doing khỏi durable eventlog (mergedInto
  `main`, mergedSha `401a2282ee381b5c2831e6f4d7538e834ada6503`).
```

### Full target shown text

```text
- **tsk-40m** — Tách live claim/doing khỏi durable eventlog (mergedInto
  `main`, mergedSha `401a2282ee381b5c2831e6f4d7538e834ada6503`).
```

## claim_713d9473418c52d938cf391dd37e669e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-169, lines 1020–1020.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-172.
Source digest: 9518c57739f4b1a0fb80252136138e55c7f61d342920a5c72597e343a348082d
Target digest: 9518c57739f4b1a0fb80252136138e55c7f61d342920a5c72597e343a348082d
Shown source SHA256: 9518c57739f4b1a0fb80252136138e55c7f61d342920a5c72597e343a348082d
Shown target SHA256: 9518c57739f4b1a0fb80252136138e55c7f61d342920a5c72597e343a348082d

### Proposed decision

```json
{
  "claimId": "claim_713d9473418c52d938cf391dd37e669e",
  "sourceUnitDigest": "9518c57739f4b1a0fb80252136138e55c7f61d342920a5c72597e343a348082d",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-172",
  "targetUnitDigest": "9518c57739f4b1a0fb80252136138e55c7f61d342920a5c72597e343a348082d",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "22. Implementation Tasks"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-169 (lines 1020–1020) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-172 (lines 1044–1044); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Commits, in landing order (all 2026-08-25):
```

### Full target shown text

```text
Commits, in landing order (all 2026-08-25):
```

## claim_a577e32c10a9955c8535fac358dd071c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-170, lines 1022–1036.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-173.
Source digest: 87078eff18b9521fa09ed7e366ae385bc14d4d2e95a113774a583ede39a01b0f
Target digest: 87078eff18b9521fa09ed7e366ae385bc14d4d2e95a113774a583ede39a01b0f
Shown source SHA256: 87078eff18b9521fa09ed7e366ae385bc14d4d2e95a113774a583ede39a01b0f
Shown target SHA256: 87078eff18b9521fa09ed7e366ae385bc14d4d2e95a113774a583ede39a01b0f

### Proposed decision

```json
{
  "claimId": "claim_a577e32c10a9955c8535fac358dd071c",
  "sourceUnitDigest": "87078eff18b9521fa09ed7e366ae385bc14d4d2e95a113774a583ede39a01b0f",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-173",
  "targetUnitDigest": "87078eff18b9521fa09ed7e366ae385bc14d4d2e95a113774a583ede39a01b0f",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "22. Implementation Tasks"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-170 (lines 1022–1036) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-173 (lines 1046–1060); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
1. `7dffb476` docs(tsk-40m): lock exploring decisions for runtime-claim/doing separation (D1-D6)
2. `6c3cfe40` docs(tsk-40m): write plan.md for runtime-claim/doing separation
3. `7c4c4a13` refactor(runner): separate live claim/doing from durable eventlog (tsk-40m)
4. `a152af34` docs(tsk-40m): Iron Law evidence for runtime-claim/doing separation
5. `9f94e847` fix(tsk-40m): close claim/settle correctness gaps found in code review
6. `3a59ac68` docs(tsk-40m): correct stale releaseClaimOnExecuting wording
7. `5f2e12b7` fix(tsk-40m): close round-2 claim/settle gaps found in follow-up code review
8. `27d47bce` feat(tsk-40m): enforce writer-identity ownership on settleClaim
9. `3d6c0044` fix(tsk-40m): close settleClaim's TOCTOU race on the write lock
10. `2e43ce3e` fix(tsk-40m): close settleClaim atomicity + release-timing gaps
11. `afc4d3dd` fix(tsk-40m): settleClaim returns the raw final event, not a nested one
12. `012af034` feat(tsk-40m): settle claim time directly to finalStatus, drop durable doing
13. `e4d269bf` fix(tsk-40m): stop ask/answer from ever writing durable doing (P1)
14. `835f162e` fix(tsk-40m): anti-loop hard-cut per locked D3, supersede stale plan.md
15. `860852fb` docs(tsk-40m): fix stale answerAwaiting comment on claim un-stale fringe case
```

### Full target shown text

```text
1. `7dffb476` docs(tsk-40m): lock exploring decisions for runtime-claim/doing separation (D1-D6)
2. `6c3cfe40` docs(tsk-40m): write plan.md for runtime-claim/doing separation
3. `7c4c4a13` refactor(runner): separate live claim/doing from durable eventlog (tsk-40m)
4. `a152af34` docs(tsk-40m): Iron Law evidence for runtime-claim/doing separation
5. `9f94e847` fix(tsk-40m): close claim/settle correctness gaps found in code review
6. `3a59ac68` docs(tsk-40m): correct stale releaseClaimOnExecuting wording
7. `5f2e12b7` fix(tsk-40m): close round-2 claim/settle gaps found in follow-up code review
8. `27d47bce` feat(tsk-40m): enforce writer-identity ownership on settleClaim
9. `3d6c0044` fix(tsk-40m): close settleClaim's TOCTOU race on the write lock
10. `2e43ce3e` fix(tsk-40m): close settleClaim atomicity + release-timing gaps
11. `afc4d3dd` fix(tsk-40m): settleClaim returns the raw final event, not a nested one
12. `012af034` feat(tsk-40m): settle claim time directly to finalStatus, drop durable doing
13. `e4d269bf` fix(tsk-40m): stop ask/answer from ever writing durable doing (P1)
14. `835f162e` fix(tsk-40m): anti-loop hard-cut per locked D3, supersede stale plan.md
15. `860852fb` docs(tsk-40m): fix stale answerAwaiting comment on claim un-stale fringe case
```

## claim_6085038b1f165f082d7c8b145f6d5e66

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-171, lines 1038–1039.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-174.
Source digest: 02a2d097a8846de8058d188b18f1245cba3a2bbdfaec1f318a22660fd4d8700e
Target digest: 02a2d097a8846de8058d188b18f1245cba3a2bbdfaec1f318a22660fd4d8700e
Shown source SHA256: 02a2d097a8846de8058d188b18f1245cba3a2bbdfaec1f318a22660fd4d8700e
Shown target SHA256: 02a2d097a8846de8058d188b18f1245cba3a2bbdfaec1f318a22660fd4d8700e

### Proposed decision

```json
{
  "claimId": "claim_6085038b1f165f082d7c8b145f6d5e66",
  "sourceUnitDigest": "02a2d097a8846de8058d188b18f1245cba3a2bbdfaec1f318a22660fd4d8700e",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-174",
  "targetUnitDigest": "02a2d097a8846de8058d188b18f1245cba3a2bbdfaec1f318a22660fd4d8700e",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "22. Implementation Tasks"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-171 (lines 1038–1039) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-174 (lines 1062–1063); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Follow-up verification/fix tasks, delivered 2026-08-26 (day after, not part
of the original deployment batch above, but closing gaps this redesign left):
```

### Full target shown text

```text
Follow-up verification/fix tasks, delivered 2026-08-26 (day after, not part
of the original deployment batch above, but closing gaps this redesign left):
```

## claim_c2d27c8b0fc5ca13bc1965b6d22faf44

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-172, lines 1041–1049.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-175.
Source digest: d7999f4e16be5f867665236011d18abf9153371071494a3b6ecdb14151c4cb25
Target digest: d7999f4e16be5f867665236011d18abf9153371071494a3b6ecdb14151c4cb25
Shown source SHA256: d7999f4e16be5f867665236011d18abf9153371071494a3b6ecdb14151c4cb25
Shown target SHA256: d7999f4e16be5f867665236011d18abf9153371071494a3b6ecdb14151c4cb25

### Proposed decision

```json
{
  "claimId": "claim_c2d27c8b0fc5ca13bc1965b6d22faf44",
  "sourceUnitDigest": "d7999f4e16be5f867665236011d18abf9153371071494a3b6ecdb14151c4cb25",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-175",
  "targetUnitDigest": "d7999f4e16be5f867665236011d18abf9153371071494a3b6ecdb14151c4cb25",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "22. Implementation Tasks"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-172 (lines 1041–1049) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-175 (lines 1065–1073); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- **tsk-1sl** — §17 review-checklist + §15 acceptance-criteria re-audit against
  real `src/` state; confirmed clean, flipped this doc's status header
  (mergedSha `e7a799207165bb0ffb4a9d5dd02e4034e7f49d11`).
- **tsk-1ht** — `settleClaim`'s revision-CAS check had no reconcile path for a
  claim-holder's own mid-lifecycle edits (§16.3 gap noted in this doc's status
  header at the time); fixed and delivered (mergedSha
  `5f818ee63c3b62abaab721ca28e46613f7ebf76a`). The status-header note above
  describing this as an open gap is now stale — kept as written since fixing
  the gap is a separate item's job, not this doc-history append's.
```

### Full target shown text

```text
- **tsk-1sl** — §17 review-checklist + §15 acceptance-criteria re-audit against
  real `src/` state; confirmed clean, flipped this doc's status header
  (mergedSha `e7a799207165bb0ffb4a9d5dd02e4034e7f49d11`).
- **tsk-1ht** — `settleClaim`'s revision-CAS check had no reconcile path for a
  claim-holder's own mid-lifecycle edits (§16.3 gap noted in this doc's status
  header at the time); fixed and delivered (mergedSha
  `5f818ee63c3b62abaab721ca28e46613f7ebf76a`). The status-header note above
  describing this as an open gap is now stale — kept as written since fixing
  the gap is a separate item's job, not this doc-history append's.
```
