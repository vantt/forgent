# Bounded proposals and redesigns review pack

Content commit: 0f063d18fdab01cb6f2c915bb60ff528c5e0f238
Original shard: plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-04-doing-coordination-redesign.json
Original shard SHA256: 2e1f828a0423d70d3f99393b1129e8acd25528e423eacca3de1f53b69f8042f6
Source file: docs/architect/doing-coordination-redesign.md
Part 2/3; entries: **80**. Source-file group 4/20.
Author session: codex-session:unit-run-1792034226117-40d90d09@2026-10-15
Row-level authoredBy is authoritative for mixed correction authors. Independent ordinary review only; all rows remain pending.

A36 differing-digest rows (0): none.

Absent-target rows (0): none.

Rows changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238 (0): none.

Weak-exact/Judgment population: 32; reviewer chooses and records seed and IDs for at least 10 deep reads (15%, minimum 10, all if fewer), plus every differing/absent pair. Mechanically verify all rows, full digests, anchors, ancestry, source eligibility, one owner and exact-proof thresholds. A36 supersedes the older 100% Weak-exact/Judgment deep-read rule in review-brief; retain its other ordinary-review obligations. If >3% deep rework, deep-read the whole pack. Mark each own note deep or mechanical. No author-selected draw or seed/key is supplied. Complete batch: 1,815 rows, 1,289 Unit-exact / 438 Weak-exact / 88 Judgment; 88 mandatory differing pairs; 114 correction rows.

Return an independent committed report with Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and this five-column table. Consolidate all parts for each original shard before unchanged ordinary application; these slices do not change shard bytes. Use ok/rework/hold with an own note and the full shown-unit digest (literal none for an absent target). Reverse eligibility and triage findings have separate requests and cannot approve these source rows.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

## Native gate blocker at the content pin

D reports eight decision-loss-without-partial-carry findings in the proposals README rationales (the phrase `it omits later siblings` describes the source index). The checker and decision content are unchanged. These are reported blockers, not waived findings. This pack contains 0 affected rows.

```json
[]
```

## claim_63ad7ebe9fb9d1061414a210cb4323ad

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-64, lines 325–333.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-67.
Source digest: 5a807006b1bb41fff29c67c653fc82c1c825b751bfa641e6df60fc6322e9f3bd
Target digest: 5a807006b1bb41fff29c67c653fc82c1c825b751bfa641e6df60fc6322e9f3bd
Shown source SHA256: 5a807006b1bb41fff29c67c653fc82c1c825b751bfa641e6df60fc6322e9f3bd
Shown target SHA256: 5a807006b1bb41fff29c67c653fc82c1c825b751bfa641e6df60fc6322e9f3bd

### Proposed decision

```json
{
  "claimId": "claim_63ad7ebe9fb9d1061414a210cb4323ad",
  "sourceUnitDigest": "5a807006b1bb41fff29c67c653fc82c1c825b751bfa641e6df60fc6322e9f3bd",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-67",
  "targetUnitDigest": "5a807006b1bb41fff29c67c653fc82c1c825b751bfa641e6df60fc6322e9f3bd",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "7. Data Model",
    "7.1 Runtime Claim"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-64 (lines 325–333) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-67 (lines 349–357); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Required properties:

- `claimId` uniquely identifies this ownership lease.
- `id` identifies the work item.
- `actor` identifies the owner allowed to settle or release.
- `preClaimStatus` is the durable status at acquire time.
- `preClaimRevision` is the durable per-item revision/hash at acquire time.
- `acquiredAt` supports audit and diagnostics.
- `lastObservedActivityAt` supports liveness-based reclaim.
```

### Full target shown text

```text
Required properties:

- `claimId` uniquely identifies this ownership lease.
- `id` identifies the work item.
- `actor` identifies the owner allowed to settle or release.
- `preClaimStatus` is the durable status at acquire time.
- `preClaimRevision` is the durable per-item revision/hash at acquire time.
- `acquiredAt` supports audit and diagnostics.
- `lastObservedActivityAt` supports liveness-based reclaim.
```

## claim_dc7248b4829986802046d6cd4e67cd22

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-65, lines 335–335.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-68.
Source digest: 7ba2359abee1534b65fc9ed955c863e752ef63455a9f73f1d6947b5f00c50d6a
Target digest: 7ba2359abee1534b65fc9ed955c863e752ef63455a9f73f1d6947b5f00c50d6a
Shown source SHA256: 7ba2359abee1534b65fc9ed955c863e752ef63455a9f73f1d6947b5f00c50d6a
Shown target SHA256: 7ba2359abee1534b65fc9ed955c863e752ef63455a9f73f1d6947b5f00c50d6a

### Proposed decision

```json
{
  "claimId": "claim_dc7248b4829986802046d6cd4e67cd22",
  "sourceUnitDigest": "7ba2359abee1534b65fc9ed955c863e752ef63455a9f73f1d6947b5f00c50d6a",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-68",
  "targetUnitDigest": "7ba2359abee1534b65fc9ed955c863e752ef63455a9f73f1d6947b5f00c50d6a",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "7. Data Model",
    "7.1 Runtime Claim"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-65 (lines 335–335) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-68 (lines 359–359); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`hardExpiresAt` is only a safety backstop. It must not replace real liveness checks.
```

### Full target shown text

```text
`hardExpiresAt` is only a safety backstop. It must not replace real liveness checks.
```

## claim_e873943af07efed886b5a5339c5089a5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#72-durable-attempt-event, lines 337–337.
Target: docs/platform/proposals/doing-coordination-redesign.md#72-durable-attempt-event.
Source digest: 5af3ec48f5599d9b47b642dd8dbed9773c41c941a1ebc2db7a6f96e207b4db04
Target digest: 5af3ec48f5599d9b47b642dd8dbed9773c41c941a1ebc2db7a6f96e207b4db04
Shown source SHA256: 50dbbb76a0df4ee3a50277ba7fac929cd61ae4810474ecf41852ffe99323b426
Shown target SHA256: 50dbbb76a0df4ee3a50277ba7fac929cd61ae4810474ecf41852ffe99323b426

### Proposed decision

```json
{
  "claimId": "claim_e873943af07efed886b5a5339c5089a5",
  "sourceUnitDigest": "5af3ec48f5599d9b47b642dd8dbed9773c41c941a1ebc2db7a6f96e207b4db04",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "72-durable-attempt-event",
  "targetUnitDigest": "5af3ec48f5599d9b47b642dd8dbed9773c41c941a1ebc2db7a6f96e207b4db04",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "7. Data Model"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#72-durable-attempt-event (lines 337–337) is carried at docs/platform/proposals/doing-coordination-redesign.md#72-durable-attempt-event (lines 361–361); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 7.2 Durable Attempt Event

When an attempt settles, releases, fails, or is reclaimed, write a durable event describing the attempt.

```json
{
  "op": "work.attempt",
  "id": "tsk-123",
  "claimId": "claim-01K3...",
  "phase": "execute",
  "from": "todo",
  "to": "awaiting-approval",
  "result": "submitted",
  "reason": "verify-pass",
  "actor": "runner-1",
  "branch": "fgw/tsk-123",
  "headAtTake": "main-head-sha-or-null",
  "branchHeadAtTake": "branch-head-before-work",
  "branchHeadAtReturn": "branch-head-after-work",
  "startedAt": "2026-08-25T03:00:00.000Z",
  "endedAt": "2026-08-25T03:40:00.000Z"
}
```

Recommended `result` values:

- `submitted` - worker completed and submitted for approval;
- `released` - owner intentionally gave the item back;
- `paused` - owner stopped active work because the item is parked on human input;
- `failed` - attempt ended unsuccessfully;
- `verify-failed` - verification failed and item moved to a parked or retryable state;
- `reclaimed` - system took ownership back from an inactive claim;
- `abandoned` - claim became invalid without a normal owner release.

The exact enum may differ, but it must cover the business meanings above.
````

### Full target shown text

````text
### 7.2 Durable Attempt Event

When an attempt settles, releases, fails, or is reclaimed, write a durable event describing the attempt.

```json
{
  "op": "work.attempt",
  "id": "tsk-123",
  "claimId": "claim-01K3...",
  "phase": "execute",
  "from": "todo",
  "to": "awaiting-approval",
  "result": "submitted",
  "reason": "verify-pass",
  "actor": "runner-1",
  "branch": "fgw/tsk-123",
  "headAtTake": "main-head-sha-or-null",
  "branchHeadAtTake": "branch-head-before-work",
  "branchHeadAtReturn": "branch-head-after-work",
  "startedAt": "2026-08-25T03:00:00.000Z",
  "endedAt": "2026-08-25T03:40:00.000Z"
}
```

Recommended `result` values:

- `submitted` - worker completed and submitted for approval;
- `released` - owner intentionally gave the item back;
- `paused` - owner stopped active work because the item is parked on human input;
- `failed` - attempt ended unsuccessfully;
- `verify-failed` - verification failed and item moved to a parked or retryable state;
- `reclaimed` - system took ownership back from an inactive claim;
- `abandoned` - claim became invalid without a normal owner release.

The exact enum may differ, but it must cover the business meanings above.
````

## claim_71be3d537242f5d63be5f6646e2a02e6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-66, lines 339–339.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-69.
Source digest: 2e39bf04dedab1dd55c99f85280ccab74e926446c9775e90a4cb5c20f2738b96
Target digest: 2e39bf04dedab1dd55c99f85280ccab74e926446c9775e90a4cb5c20f2738b96
Shown source SHA256: 2e39bf04dedab1dd55c99f85280ccab74e926446c9775e90a4cb5c20f2738b96
Shown target SHA256: 2e39bf04dedab1dd55c99f85280ccab74e926446c9775e90a4cb5c20f2738b96

### Proposed decision

```json
{
  "claimId": "claim_71be3d537242f5d63be5f6646e2a02e6",
  "sourceUnitDigest": "2e39bf04dedab1dd55c99f85280ccab74e926446c9775e90a4cb5c20f2738b96",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-69",
  "targetUnitDigest": "2e39bf04dedab1dd55c99f85280ccab74e926446c9775e90a4cb5c20f2738b96",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "7. Data Model",
    "7.2 Durable Attempt Event"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-66 (lines 339–339) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-69 (lines 363–363); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
When an attempt settles, releases, fails, or is reclaimed, write a durable event describing the attempt.
```

### Full target shown text

```text
When an attempt settles, releases, fails, or is reclaimed, write a durable event describing the attempt.
```

## claim_01d74a4b11a99662d32ddb3b316d6105

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-67, lines 341–359.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-70.
Source digest: 51aa2c07d34eaee02cf896f4bb11ff9c863bda253cce81c34829b2ca81ba5338
Target digest: 51aa2c07d34eaee02cf896f4bb11ff9c863bda253cce81c34829b2ca81ba5338
Shown source SHA256: 51aa2c07d34eaee02cf896f4bb11ff9c863bda253cce81c34829b2ca81ba5338
Shown target SHA256: 51aa2c07d34eaee02cf896f4bb11ff9c863bda253cce81c34829b2ca81ba5338

### Proposed decision

```json
{
  "claimId": "claim_01d74a4b11a99662d32ddb3b316d6105",
  "sourceUnitDigest": "51aa2c07d34eaee02cf896f4bb11ff9c863bda253cce81c34829b2ca81ba5338",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-70",
  "targetUnitDigest": "51aa2c07d34eaee02cf896f4bb11ff9c863bda253cce81c34829b2ca81ba5338",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "7. Data Model",
    "7.2 Durable Attempt Event"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-67 (lines 341–359) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-70 (lines 365–383); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```json
{
  "op": "work.attempt",
  "id": "tsk-123",
  "claimId": "claim-01K3...",
  "phase": "execute",
  "from": "todo",
  "to": "awaiting-approval",
  "result": "submitted",
  "reason": "verify-pass",
  "actor": "runner-1",
  "branch": "fgw/tsk-123",
  "headAtTake": "main-head-sha-or-null",
  "branchHeadAtTake": "branch-head-before-work",
  "branchHeadAtReturn": "branch-head-after-work",
  "startedAt": "2026-08-25T03:00:00.000Z",
  "endedAt": "2026-08-25T03:40:00.000Z"
}
```
````

### Full target shown text

````text
```json
{
  "op": "work.attempt",
  "id": "tsk-123",
  "claimId": "claim-01K3...",
  "phase": "execute",
  "from": "todo",
  "to": "awaiting-approval",
  "result": "submitted",
  "reason": "verify-pass",
  "actor": "runner-1",
  "branch": "fgw/tsk-123",
  "headAtTake": "main-head-sha-or-null",
  "branchHeadAtTake": "branch-head-before-work",
  "branchHeadAtReturn": "branch-head-after-work",
  "startedAt": "2026-08-25T03:00:00.000Z",
  "endedAt": "2026-08-25T03:40:00.000Z"
}
```
````

## claim_6826fa900700e43369571845f647e2a7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-68, lines 361–361.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-71.
Source digest: 87b40144567208e157cc9cbaf11756643d26b00edcb332bc1cc03032bd321f72
Target digest: 87b40144567208e157cc9cbaf11756643d26b00edcb332bc1cc03032bd321f72
Shown source SHA256: 87b40144567208e157cc9cbaf11756643d26b00edcb332bc1cc03032bd321f72
Shown target SHA256: 87b40144567208e157cc9cbaf11756643d26b00edcb332bc1cc03032bd321f72

### Proposed decision

```json
{
  "claimId": "claim_6826fa900700e43369571845f647e2a7",
  "sourceUnitDigest": "87b40144567208e157cc9cbaf11756643d26b00edcb332bc1cc03032bd321f72",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-71",
  "targetUnitDigest": "87b40144567208e157cc9cbaf11756643d26b00edcb332bc1cc03032bd321f72",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "7. Data Model",
    "7.2 Durable Attempt Event"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-68 (lines 361–361) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-71 (lines 385–385); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Recommended `result` values:
```

### Full target shown text

```text
Recommended `result` values:
```

## claim_9e2327a1301304032dccf3b0b872fc60

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-69, lines 363–369.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-72.
Source digest: 8f4d026c55f278ce4761ac0fda04b25e2c01ce67531af7405aeb4a81151e47ae
Target digest: 8f4d026c55f278ce4761ac0fda04b25e2c01ce67531af7405aeb4a81151e47ae
Shown source SHA256: 8f4d026c55f278ce4761ac0fda04b25e2c01ce67531af7405aeb4a81151e47ae
Shown target SHA256: 8f4d026c55f278ce4761ac0fda04b25e2c01ce67531af7405aeb4a81151e47ae

### Proposed decision

```json
{
  "claimId": "claim_9e2327a1301304032dccf3b0b872fc60",
  "sourceUnitDigest": "8f4d026c55f278ce4761ac0fda04b25e2c01ce67531af7405aeb4a81151e47ae",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-72",
  "targetUnitDigest": "8f4d026c55f278ce4761ac0fda04b25e2c01ce67531af7405aeb4a81151e47ae",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "7. Data Model",
    "7.2 Durable Attempt Event"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-69 (lines 363–369) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-72 (lines 387–393); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- `submitted` - worker completed and submitted for approval;
- `released` - owner intentionally gave the item back;
- `paused` - owner stopped active work because the item is parked on human input;
- `failed` - attempt ended unsuccessfully;
- `verify-failed` - verification failed and item moved to a parked or retryable state;
- `reclaimed` - system took ownership back from an inactive claim;
- `abandoned` - claim became invalid without a normal owner release.
```

### Full target shown text

```text
- `submitted` - worker completed and submitted for approval;
- `released` - owner intentionally gave the item back;
- `paused` - owner stopped active work because the item is parked on human input;
- `failed` - attempt ended unsuccessfully;
- `verify-failed` - verification failed and item moved to a parked or retryable state;
- `reclaimed` - system took ownership back from an inactive claim;
- `abandoned` - claim became invalid without a normal owner release.
```

## claim_32bd177ca43f8718824c6208626ad8d5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-70, lines 371–371.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-73.
Source digest: 3f72b73371798a7bb770887a00e4122349c20b10f2cb08794fd12ebd60dbf8dc
Target digest: 3f72b73371798a7bb770887a00e4122349c20b10f2cb08794fd12ebd60dbf8dc
Shown source SHA256: 3f72b73371798a7bb770887a00e4122349c20b10f2cb08794fd12ebd60dbf8dc
Shown target SHA256: 3f72b73371798a7bb770887a00e4122349c20b10f2cb08794fd12ebd60dbf8dc

### Proposed decision

```json
{
  "claimId": "claim_32bd177ca43f8718824c6208626ad8d5",
  "sourceUnitDigest": "3f72b73371798a7bb770887a00e4122349c20b10f2cb08794fd12ebd60dbf8dc",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-73",
  "targetUnitDigest": "3f72b73371798a7bb770887a00e4122349c20b10f2cb08794fd12ebd60dbf8dc",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "7. Data Model",
    "7.2 Durable Attempt Event"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-70 (lines 371–371) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-73 (lines 395–395); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The exact enum may differ, but it must cover the business meanings above.
```

### Full target shown text

```text
The exact enum may differ, but it must cover the business meanings above.
```

## claim_66b51e88375efa8e0fd8e81daea17b75

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#73-durable-workflow-move, lines 373–373.
Target: docs/platform/proposals/doing-coordination-redesign.md#73-durable-workflow-move.
Source digest: e8f962695238d480d60779bfb64f136446951ffdaeabc1a0dc5e9b118bac2179
Target digest: e8f962695238d480d60779bfb64f136446951ffdaeabc1a0dc5e9b118bac2179
Shown source SHA256: 39db20ef2b3a27fbe20f5ee167eec79db0222cab136b8bb73cef7f5930d6d7ba
Shown target SHA256: 39db20ef2b3a27fbe20f5ee167eec79db0222cab136b8bb73cef7f5930d6d7ba

### Proposed decision

```json
{
  "claimId": "claim_66b51e88375efa8e0fd8e81daea17b75",
  "sourceUnitDigest": "e8f962695238d480d60779bfb64f136446951ffdaeabc1a0dc5e9b118bac2179",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "73-durable-workflow-move",
  "targetUnitDigest": "e8f962695238d480d60779bfb64f136446951ffdaeabc1a0dc5e9b118bac2179",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "7. Data Model"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#73-durable-workflow-move (lines 373–373) is carried at docs/platform/proposals/doing-coordination-redesign.md#73-durable-workflow-move (lines 397–397); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 7.3 Durable Workflow Move

If an attempt changes stable workflow status, write the durable workflow move as part of the same settlement operation.

Example settlement:

```txt
runtime before:
  active claim exists for tsk-123

durable before:
  status = todo
  revision = rev-10

settle:
  validate claimId, owner, preClaimStatus, preClaimRevision
  append work.attempt result=submitted from=todo to=awaiting-approval
  append work.move to=awaiting-approval expectedRevision=rev-10
  remove runtime claim

effective after:
  status = awaiting-approval
```

No durable intermediate `work.move to=doing` is required.
````

### Full target shown text

````text
### 7.3 Durable Workflow Move

If an attempt changes stable workflow status, write the durable workflow move as part of the same settlement operation.

Example settlement:

```txt
runtime before:
  active claim exists for tsk-123

durable before:
  status = todo
  revision = rev-10

settle:
  validate claimId, owner, preClaimStatus, preClaimRevision
  append work.attempt result=submitted from=todo to=awaiting-approval
  append work.move to=awaiting-approval expectedRevision=rev-10
  remove runtime claim

effective after:
  status = awaiting-approval
```

No durable intermediate `work.move to=doing` is required.
````

## claim_2dc05bcea9c8f4afcf74d13329cc66d4

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-71, lines 375–375.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-74.
Source digest: 8525b1704519b3d7dddbf82275df8394d2cbda1ea2b851194ef73dc1a0c7344d
Target digest: 8525b1704519b3d7dddbf82275df8394d2cbda1ea2b851194ef73dc1a0c7344d
Shown source SHA256: 8525b1704519b3d7dddbf82275df8394d2cbda1ea2b851194ef73dc1a0c7344d
Shown target SHA256: 8525b1704519b3d7dddbf82275df8394d2cbda1ea2b851194ef73dc1a0c7344d

### Proposed decision

```json
{
  "claimId": "claim_2dc05bcea9c8f4afcf74d13329cc66d4",
  "sourceUnitDigest": "8525b1704519b3d7dddbf82275df8394d2cbda1ea2b851194ef73dc1a0c7344d",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-74",
  "targetUnitDigest": "8525b1704519b3d7dddbf82275df8394d2cbda1ea2b851194ef73dc1a0c7344d",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "7. Data Model",
    "7.3 Durable Workflow Move"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-71 (lines 375–375) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-74 (lines 399–399); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
If an attempt changes stable workflow status, write the durable workflow move as part of the same settlement operation.
```

### Full target shown text

```text
If an attempt changes stable workflow status, write the durable workflow move as part of the same settlement operation.
```

## claim_cc5cefced5f6a1379921a48d8ad75af8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-72, lines 377–395.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-75.
Source digest: 11ec0c400157f8d62919e79ccc8d91e304995da1f625f7a501971b665f79d927
Target digest: 11ec0c400157f8d62919e79ccc8d91e304995da1f625f7a501971b665f79d927
Shown source SHA256: 11ec0c400157f8d62919e79ccc8d91e304995da1f625f7a501971b665f79d927
Shown target SHA256: 11ec0c400157f8d62919e79ccc8d91e304995da1f625f7a501971b665f79d927

### Proposed decision

```json
{
  "claimId": "claim_cc5cefced5f6a1379921a48d8ad75af8",
  "sourceUnitDigest": "11ec0c400157f8d62919e79ccc8d91e304995da1f625f7a501971b665f79d927",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-75",
  "targetUnitDigest": "11ec0c400157f8d62919e79ccc8d91e304995da1f625f7a501971b665f79d927",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "7. Data Model",
    "7.3 Durable Workflow Move"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-72 (lines 377–395) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-75 (lines 401–419); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
Example settlement:

```txt
runtime before:
  active claim exists for tsk-123

durable before:
  status = todo
  revision = rev-10

settle:
  validate claimId, owner, preClaimStatus, preClaimRevision
  append work.attempt result=submitted from=todo to=awaiting-approval
  append work.move to=awaiting-approval expectedRevision=rev-10
  remove runtime claim

effective after:
  status = awaiting-approval
```
````

### Full target shown text

````text
Example settlement:

```txt
runtime before:
  active claim exists for tsk-123

durable before:
  status = todo
  revision = rev-10

settle:
  validate claimId, owner, preClaimStatus, preClaimRevision
  append work.attempt result=submitted from=todo to=awaiting-approval
  append work.move to=awaiting-approval expectedRevision=rev-10
  remove runtime claim

effective after:
  status = awaiting-approval
```
````

## claim_e0f1c4392f812deeea92701144c11eae

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-73, lines 397–397.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-76.
Source digest: faf93cd30589778ba875336f0bfcb26789d989e97d19f579cf6761768eb0ed0a
Target digest: faf93cd30589778ba875336f0bfcb26789d989e97d19f579cf6761768eb0ed0a
Shown source SHA256: faf93cd30589778ba875336f0bfcb26789d989e97d19f579cf6761768eb0ed0a
Shown target SHA256: faf93cd30589778ba875336f0bfcb26789d989e97d19f579cf6761768eb0ed0a

### Proposed decision

```json
{
  "claimId": "claim_e0f1c4392f812deeea92701144c11eae",
  "sourceUnitDigest": "faf93cd30589778ba875336f0bfcb26789d989e97d19f579cf6761768eb0ed0a",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-76",
  "targetUnitDigest": "faf93cd30589778ba875336f0bfcb26789d989e97d19f579cf6761768eb0ed0a",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "7. Data Model",
    "7.3 Durable Workflow Move"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-73 (lines 397–397) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-76 (lines 421–421); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
No durable intermediate `work.move to=doing` is required.
```

### Full target shown text

```text
No durable intermediate `work.move to=doing` is required.
```

## claim_99f684133463b05fe0b0dc04d072f146

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#8-module-boundaries, lines 399–399.
Target: docs/platform/proposals/doing-coordination-redesign.md#8-module-boundaries.
Source digest: 7822eaefc7ea3848d705b931769ea400a73b2e0f43f3982973679bce8ab273ca
Target digest: 7822eaefc7ea3848d705b931769ea400a73b2e0f43f3982973679bce8ab273ca
Shown source SHA256: 5e7a18f623cc32fed93cafd542cd3d138ec90ffa4e207f81faa894b15cc57032
Shown target SHA256: 5e7a18f623cc32fed93cafd542cd3d138ec90ffa4e207f81faa894b15cc57032

### Proposed decision

```json
{
  "claimId": "claim_99f684133463b05fe0b0dc04d072f146",
  "sourceUnitDigest": "7822eaefc7ea3848d705b931769ea400a73b2e0f43f3982973679bce8ab273ca",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "8-module-boundaries",
  "targetUnitDigest": "7822eaefc7ea3848d705b931769ea400a73b2e0f43f3982973679bce8ab273ca",
  "targetAncestry": [
    "Doing Coordination Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#8-module-boundaries (lines 399–399) is carried at docs/platform/proposals/doing-coordination-redesign.md#8-module-boundaries (lines 423–423); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 8. Module Boundaries
```

### Full target shown text

```text
## 8. Module Boundaries
```

## claim_df7f96c5daa4ef1c7f8bf59c8660f864

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#81-coordination-module, lines 401–401.
Target: docs/platform/proposals/doing-coordination-redesign.md#81-coordination-module.
Source digest: 68ebb6af47e8c305f39ef8fbec20c5a0334660fb7481cc91fa087ff463da924c
Target digest: 68ebb6af47e8c305f39ef8fbec20c5a0334660fb7481cc91fa087ff463da924c
Shown source SHA256: 2185e90755f5ff1f6dab9144b5da936359f63150f93a2040c516dcae29a26358
Shown target SHA256: 2185e90755f5ff1f6dab9144b5da936359f63150f93a2040c516dcae29a26358

### Proposed decision

```json
{
  "claimId": "claim_df7f96c5daa4ef1c7f8bf59c8660f864",
  "sourceUnitDigest": "68ebb6af47e8c305f39ef8fbec20c5a0334660fb7481cc91fa087ff463da924c",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "81-coordination-module",
  "targetUnitDigest": "68ebb6af47e8c305f39ef8fbec20c5a0334660fb7481cc91fa087ff463da924c",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "8. Module Boundaries"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#81-coordination-module (lines 401–401) is carried at docs/platform/proposals/doing-coordination-redesign.md#81-coordination-module (lines 425–425); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 8.1 Coordination Module

Owns runtime active claims.

Responsibilities:

- acquire claim;
- read active claims;
- validate claim ownership;
- update liveness observation;
- release claim;
- reclaim eligible stale claims.

It may share field names with durable attempt events, but it must not write durable workflow history directly except through the store facade.
```

### Full target shown text

```text
### 8.1 Coordination Module

Owns runtime active claims.

Responsibilities:

- acquire claim;
- read active claims;
- validate claim ownership;
- update liveness observation;
- release claim;
- reclaim eligible stale claims.

It may share field names with durable attempt events, but it must not write durable workflow history directly except through the store facade.
```

## claim_0c95d11819e273f849f2a58e26c08072

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-74, lines 403–403.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-77.
Source digest: bfa7e4be5a9674c6d55609c5b5a0d83eebeca5fdb6894755aa7b3498252ecda4
Target digest: bfa7e4be5a9674c6d55609c5b5a0d83eebeca5fdb6894755aa7b3498252ecda4
Shown source SHA256: bfa7e4be5a9674c6d55609c5b5a0d83eebeca5fdb6894755aa7b3498252ecda4
Shown target SHA256: bfa7e4be5a9674c6d55609c5b5a0d83eebeca5fdb6894755aa7b3498252ecda4

### Proposed decision

```json
{
  "claimId": "claim_0c95d11819e273f849f2a58e26c08072",
  "sourceUnitDigest": "bfa7e4be5a9674c6d55609c5b5a0d83eebeca5fdb6894755aa7b3498252ecda4",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-77",
  "targetUnitDigest": "bfa7e4be5a9674c6d55609c5b5a0d83eebeca5fdb6894755aa7b3498252ecda4",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "8. Module Boundaries",
    "8.1 Coordination Module"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-74 (lines 403–403) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-77 (lines 427–427); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Owns runtime active claims.
```

### Full target shown text

```text
Owns runtime active claims.
```

## claim_5ba59d2be7777d6bdf4ed5b86562223f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-75, lines 405–412.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-78.
Source digest: ac4d68f5407961f3428cdea05ff2cfdfcdf83dc26589e29c06e8c788b8408099
Target digest: ac4d68f5407961f3428cdea05ff2cfdfcdf83dc26589e29c06e8c788b8408099
Shown source SHA256: ac4d68f5407961f3428cdea05ff2cfdfcdf83dc26589e29c06e8c788b8408099
Shown target SHA256: ac4d68f5407961f3428cdea05ff2cfdfcdf83dc26589e29c06e8c788b8408099

### Proposed decision

```json
{
  "claimId": "claim_5ba59d2be7777d6bdf4ed5b86562223f",
  "sourceUnitDigest": "ac4d68f5407961f3428cdea05ff2cfdfcdf83dc26589e29c06e8c788b8408099",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-78",
  "targetUnitDigest": "ac4d68f5407961f3428cdea05ff2cfdfcdf83dc26589e29c06e8c788b8408099",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "8. Module Boundaries",
    "8.1 Coordination Module"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-75 (lines 405–412) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-78 (lines 429–436); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Responsibilities:

- acquire claim;
- read active claims;
- validate claim ownership;
- update liveness observation;
- release claim;
- reclaim eligible stale claims.
```

### Full target shown text

```text
Responsibilities:

- acquire claim;
- read active claims;
- validate claim ownership;
- update liveness observation;
- release claim;
- reclaim eligible stale claims.
```

## claim_1021ef25b551328a6d16e33c40274314

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-76, lines 414–414.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-79.
Source digest: 0cfcb2dc2ef1e8a43019abc12f3e20bb62adaf59b46146237ae5e12003362ca9
Target digest: 0cfcb2dc2ef1e8a43019abc12f3e20bb62adaf59b46146237ae5e12003362ca9
Shown source SHA256: 0cfcb2dc2ef1e8a43019abc12f3e20bb62adaf59b46146237ae5e12003362ca9
Shown target SHA256: 0cfcb2dc2ef1e8a43019abc12f3e20bb62adaf59b46146237ae5e12003362ca9

### Proposed decision

```json
{
  "claimId": "claim_1021ef25b551328a6d16e33c40274314",
  "sourceUnitDigest": "0cfcb2dc2ef1e8a43019abc12f3e20bb62adaf59b46146237ae5e12003362ca9",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-79",
  "targetUnitDigest": "0cfcb2dc2ef1e8a43019abc12f3e20bb62adaf59b46146237ae5e12003362ca9",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "8. Module Boundaries",
    "8.1 Coordination Module"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-76 (lines 414–414) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-79 (lines 438–438); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
It may share field names with durable attempt events, but it must not write durable workflow history directly except through the store facade.
```

### Full target shown text

```text
It may share field names with durable attempt events, but it must not write durable workflow history directly except through the store facade.
```

## claim_a2540a5791d876d6ab5d2ecba410895d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#82-durable-store-module, lines 416–416.
Target: docs/platform/proposals/doing-coordination-redesign.md#82-durable-store-module.
Source digest: a4fccb962484f89585197307d1deb72a384e46d24534baba9f0285320dc44be5
Target digest: a4fccb962484f89585197307d1deb72a384e46d24534baba9f0285320dc44be5
Shown source SHA256: 4e5a8e135a58e5f92aff461dd9f942c1769125a8d6009c882920095db5a886e8
Shown target SHA256: 4e5a8e135a58e5f92aff461dd9f942c1769125a8d6009c882920095db5a886e8

### Proposed decision

```json
{
  "claimId": "claim_a2540a5791d876d6ab5d2ecba410895d",
  "sourceUnitDigest": "a4fccb962484f89585197307d1deb72a384e46d24534baba9f0285320dc44be5",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "82-durable-store-module",
  "targetUnitDigest": "a4fccb962484f89585197307d1deb72a384e46d24534baba9f0285320dc44be5",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "8. Module Boundaries"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#82-durable-store-module (lines 416–416) is carried at docs/platform/proposals/doing-coordination-redesign.md#82-durable-store-module (lines 440–440); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 8.2 Durable Store Module

Owns append-only durable event writes and derived durable view refresh.

Responsibilities:

- validate durable workflow transitions;
- append durable events;
- rebuild durable state;
- expose durable item revision/hash;
- record attempt history.

It must not use runtime claim files as durable truth.
```

### Full target shown text

```text
### 8.2 Durable Store Module

Owns append-only durable event writes and derived durable view refresh.

Responsibilities:

- validate durable workflow transitions;
- append durable events;
- rebuild durable state;
- expose durable item revision/hash;
- record attempt history.

It must not use runtime claim files as durable truth.
```

## claim_918f5116fc617928679bbaa56f72cfae

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-77, lines 418–418.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-80.
Source digest: 2d1c85b7f79cdb08ab23971c541ecd3deeb44647500d5353f83151e782e550c6
Target digest: 2d1c85b7f79cdb08ab23971c541ecd3deeb44647500d5353f83151e782e550c6
Shown source SHA256: 2d1c85b7f79cdb08ab23971c541ecd3deeb44647500d5353f83151e782e550c6
Shown target SHA256: 2d1c85b7f79cdb08ab23971c541ecd3deeb44647500d5353f83151e782e550c6

### Proposed decision

```json
{
  "claimId": "claim_918f5116fc617928679bbaa56f72cfae",
  "sourceUnitDigest": "2d1c85b7f79cdb08ab23971c541ecd3deeb44647500d5353f83151e782e550c6",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-80",
  "targetUnitDigest": "2d1c85b7f79cdb08ab23971c541ecd3deeb44647500d5353f83151e782e550c6",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "8. Module Boundaries",
    "8.2 Durable Store Module"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-77 (lines 418–418) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-80 (lines 442–442); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Owns append-only durable event writes and derived durable view refresh.
```

### Full target shown text

```text
Owns append-only durable event writes and derived durable view refresh.
```

## claim_3a833a36d55870c2a564bf887d180a8f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-78, lines 420–426.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-81.
Source digest: 4723c2c84de82995ab9a877f8ecb7b396b02548deeb6cd6a99f741694351a8e2
Target digest: 4723c2c84de82995ab9a877f8ecb7b396b02548deeb6cd6a99f741694351a8e2
Shown source SHA256: 4723c2c84de82995ab9a877f8ecb7b396b02548deeb6cd6a99f741694351a8e2
Shown target SHA256: 4723c2c84de82995ab9a877f8ecb7b396b02548deeb6cd6a99f741694351a8e2

### Proposed decision

```json
{
  "claimId": "claim_3a833a36d55870c2a564bf887d180a8f",
  "sourceUnitDigest": "4723c2c84de82995ab9a877f8ecb7b396b02548deeb6cd6a99f741694351a8e2",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-81",
  "targetUnitDigest": "4723c2c84de82995ab9a877f8ecb7b396b02548deeb6cd6a99f741694351a8e2",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "8. Module Boundaries",
    "8.2 Durable Store Module"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-78 (lines 420–426) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-81 (lines 444–450); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Responsibilities:

- validate durable workflow transitions;
- append durable events;
- rebuild durable state;
- expose durable item revision/hash;
- record attempt history.
```

### Full target shown text

```text
Responsibilities:

- validate durable workflow transitions;
- append durable events;
- rebuild durable state;
- expose durable item revision/hash;
- record attempt history.
```

## claim_ff5987756afad483a4888db5f67bb252

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-79, lines 428–428.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-82.
Source digest: d424a0b62b904fac469c0639cd8978e990980c86d40dbd81095de43e204285a7
Target digest: d424a0b62b904fac469c0639cd8978e990980c86d40dbd81095de43e204285a7
Shown source SHA256: d424a0b62b904fac469c0639cd8978e990980c86d40dbd81095de43e204285a7
Shown target SHA256: d424a0b62b904fac469c0639cd8978e990980c86d40dbd81095de43e204285a7

### Proposed decision

```json
{
  "claimId": "claim_ff5987756afad483a4888db5f67bb252",
  "sourceUnitDigest": "d424a0b62b904fac469c0639cd8978e990980c86d40dbd81095de43e204285a7",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-82",
  "targetUnitDigest": "d424a0b62b904fac469c0639cd8978e990980c86d40dbd81095de43e204285a7",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "8. Module Boundaries",
    "8.2 Durable Store Module"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-79 (lines 428–428) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-82 (lines 452–452); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
It must not use runtime claim files as durable truth.
```

### Full target shown text

```text
It must not use runtime claim files as durable truth.
```

## claim_12b2713d6b37281ff83aac300e1d5477

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#83-effective-view-module, lines 430–430.
Target: docs/platform/proposals/doing-coordination-redesign.md#83-effective-view-module.
Source digest: bfc7b11ab1eb4b15a8440e43c66be38c8b6376e796da62c16144c9bb8eac5816
Target digest: bfc7b11ab1eb4b15a8440e43c66be38c8b6376e796da62c16144c9bb8eac5816
Shown source SHA256: b14e96dac69b2a948f06efeb1aa991b72ae71a010429c0a02e71dd8c5adf9747
Shown target SHA256: b14e96dac69b2a948f06efeb1aa991b72ae71a010429c0a02e71dd8c5adf9747

### Proposed decision

```json
{
  "claimId": "claim_12b2713d6b37281ff83aac300e1d5477",
  "sourceUnitDigest": "bfc7b11ab1eb4b15a8440e43c66be38c8b6376e796da62c16144c9bb8eac5816",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "83-effective-view-module",
  "targetUnitDigest": "bfc7b11ab1eb4b15a8440e43c66be38c8b6376e796da62c16144c9bb8eac5816",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "8. Module Boundaries"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#83-effective-view-module (lines 430–430) is carried at docs/platform/proposals/doing-coordination-redesign.md#83-effective-view-module (lines 454–454); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 8.3 Effective View Module

Owns overlay composition.

Responsibilities:

- combine durable view with active claims;
- compute `effectiveStatus`;
- expose claim metadata safe for display;
- preserve durable attempt metadata;
- provide read helpers for status queries and scheduling.

This module is the read boundary for scheduling and UI surfaces. Code that asks "what is doing now?" must go through this module or an equivalent explicit overlay helper.
```

### Full target shown text

```text
### 8.3 Effective View Module

Owns overlay composition.

Responsibilities:

- combine durable view with active claims;
- compute `effectiveStatus`;
- expose claim metadata safe for display;
- preserve durable attempt metadata;
- provide read helpers for status queries and scheduling.

This module is the read boundary for scheduling and UI surfaces. Code that asks "what is doing now?" must go through this module or an equivalent explicit overlay helper.
```

## claim_4452f54cdf289bd841a21b6f9155137a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-80, lines 432–432.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-83.
Source digest: 75db78f9b8bf3122996c52cb68a9529d345da6857ef0cf44989a833efa9eae2e
Target digest: 75db78f9b8bf3122996c52cb68a9529d345da6857ef0cf44989a833efa9eae2e
Shown source SHA256: 75db78f9b8bf3122996c52cb68a9529d345da6857ef0cf44989a833efa9eae2e
Shown target SHA256: 75db78f9b8bf3122996c52cb68a9529d345da6857ef0cf44989a833efa9eae2e

### Proposed decision

```json
{
  "claimId": "claim_4452f54cdf289bd841a21b6f9155137a",
  "sourceUnitDigest": "75db78f9b8bf3122996c52cb68a9529d345da6857ef0cf44989a833efa9eae2e",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-83",
  "targetUnitDigest": "75db78f9b8bf3122996c52cb68a9529d345da6857ef0cf44989a833efa9eae2e",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "8. Module Boundaries",
    "8.3 Effective View Module"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-80 (lines 432–432) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-83 (lines 456–456); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Owns overlay composition.
```

### Full target shown text

```text
Owns overlay composition.
```

## claim_6ebcb9b215afd5c941089deb5f0bb1cc

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-81, lines 434–440.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-84.
Source digest: 7322a544d25da476aca107e860b37736f8fc7e95165abfbf60b8fc3dde02a245
Target digest: 7322a544d25da476aca107e860b37736f8fc7e95165abfbf60b8fc3dde02a245
Shown source SHA256: 7322a544d25da476aca107e860b37736f8fc7e95165abfbf60b8fc3dde02a245
Shown target SHA256: 7322a544d25da476aca107e860b37736f8fc7e95165abfbf60b8fc3dde02a245

### Proposed decision

```json
{
  "claimId": "claim_6ebcb9b215afd5c941089deb5f0bb1cc",
  "sourceUnitDigest": "7322a544d25da476aca107e860b37736f8fc7e95165abfbf60b8fc3dde02a245",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-84",
  "targetUnitDigest": "7322a544d25da476aca107e860b37736f8fc7e95165abfbf60b8fc3dde02a245",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "8. Module Boundaries",
    "8.3 Effective View Module"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-81 (lines 434–440) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-84 (lines 458–464); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Responsibilities:

- combine durable view with active claims;
- compute `effectiveStatus`;
- expose claim metadata safe for display;
- preserve durable attempt metadata;
- provide read helpers for status queries and scheduling.
```

### Full target shown text

```text
Responsibilities:

- combine durable view with active claims;
- compute `effectiveStatus`;
- expose claim metadata safe for display;
- preserve durable attempt metadata;
- provide read helpers for status queries and scheduling.
```

## claim_ee1b67efc8f5e1fc2c2ce3ea87adfaf9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-82, lines 442–442.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-85.
Source digest: e9474eb60dca29c27e0f3ca0950e7d945c4042c9076547a8476203ae6455a1a1
Target digest: e9474eb60dca29c27e0f3ca0950e7d945c4042c9076547a8476203ae6455a1a1
Shown source SHA256: e9474eb60dca29c27e0f3ca0950e7d945c4042c9076547a8476203ae6455a1a1
Shown target SHA256: e9474eb60dca29c27e0f3ca0950e7d945c4042c9076547a8476203ae6455a1a1

### Proposed decision

```json
{
  "claimId": "claim_ee1b67efc8f5e1fc2c2ce3ea87adfaf9",
  "sourceUnitDigest": "e9474eb60dca29c27e0f3ca0950e7d945c4042c9076547a8476203ae6455a1a1",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-85",
  "targetUnitDigest": "e9474eb60dca29c27e0f3ca0950e7d945c4042c9076547a8476203ae6455a1a1",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "8. Module Boundaries",
    "8.3 Effective View Module"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-82 (lines 442–442) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-85 (lines 466–466); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
This module is the read boundary for scheduling and UI surfaces. Code that asks "what is doing now?" must go through this module or an equivalent explicit overlay helper.
```

### Full target shown text

```text
This module is the read boundary for scheduling and UI surfaces. Code that asks "what is doing now?" must go through this module or an equivalent explicit overlay helper.
```

## claim_0c5e88691413a79ce706c09fe2e06d2c

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#84-claim-port, lines 444–444.
Target: docs/platform/proposals/doing-coordination-redesign.md#84-claim-port.
Source digest: 20f67983b32a3fceef6499fc6bd4ab2b91c5c06b14a5c97e415eb5bd35e2008d
Target digest: 20f67983b32a3fceef6499fc6bd4ab2b91c5c06b14a5c97e415eb5bd35e2008d
Shown source SHA256: 3938e30bd327ac37dbded871d0b344ea531ab191905ef7d3d781be1e38f29049
Shown target SHA256: 3938e30bd327ac37dbded871d0b344ea531ab191905ef7d3d781be1e38f29049

### Proposed decision

```json
{
  "claimId": "claim_0c5e88691413a79ce706c09fe2e06d2c",
  "sourceUnitDigest": "20f67983b32a3fceef6499fc6bd4ab2b91c5c06b14a5c97e415eb5bd35e2008d",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "84-claim-port",
  "targetUnitDigest": "20f67983b32a3fceef6499fc6bd4ab2b91c5c06b14a5c97e415eb5bd35e2008d",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "8. Module Boundaries"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#84-claim-port (lines 444–444) is carried at docs/platform/proposals/doing-coordination-redesign.md#84-claim-port (lines 468–468); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 8.4 Claim Port

The claim port remains the choke point for user and runner claim flows.

Responsibilities:

- select eligible item using effective view;
- acquire runtime claim atomically;
- create/attach worktree or branch context;
- return claim information to caller;
- avoid durable `work.move -> doing`.

No caller should implement its own claim eligibility or active-claim write path.
```

### Full target shown text

```text
### 8.4 Claim Port

The claim port remains the choke point for user and runner claim flows.

Responsibilities:

- select eligible item using effective view;
- acquire runtime claim atomically;
- create/attach worktree or branch context;
- return claim information to caller;
- avoid durable `work.move -> doing`.

No caller should implement its own claim eligibility or active-claim write path.
```

## claim_dcc0c986c478aeac3420d664a65fd7cf

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-83, lines 446–446.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-86.
Source digest: 80f47bb3507085db235b4fbb33539c5b78014839b1c778001de96bf200379da6
Target digest: 80f47bb3507085db235b4fbb33539c5b78014839b1c778001de96bf200379da6
Shown source SHA256: 80f47bb3507085db235b4fbb33539c5b78014839b1c778001de96bf200379da6
Shown target SHA256: 80f47bb3507085db235b4fbb33539c5b78014839b1c778001de96bf200379da6

### Proposed decision

```json
{
  "claimId": "claim_dcc0c986c478aeac3420d664a65fd7cf",
  "sourceUnitDigest": "80f47bb3507085db235b4fbb33539c5b78014839b1c778001de96bf200379da6",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-86",
  "targetUnitDigest": "80f47bb3507085db235b4fbb33539c5b78014839b1c778001de96bf200379da6",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "8. Module Boundaries",
    "8.4 Claim Port"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-83 (lines 446–446) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-86 (lines 470–470); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The claim port remains the choke point for user and runner claim flows.
```

### Full target shown text

```text
The claim port remains the choke point for user and runner claim flows.
```

## claim_731f5544420713de2e849e4e757c3fb7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-84, lines 448–454.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-87.
Source digest: 6b61c92590d902b56c0c6555109c618b9765ff122616e89d0b31721a561c494c
Target digest: 6b61c92590d902b56c0c6555109c618b9765ff122616e89d0b31721a561c494c
Shown source SHA256: 6b61c92590d902b56c0c6555109c618b9765ff122616e89d0b31721a561c494c
Shown target SHA256: 6b61c92590d902b56c0c6555109c618b9765ff122616e89d0b31721a561c494c

### Proposed decision

```json
{
  "claimId": "claim_731f5544420713de2e849e4e757c3fb7",
  "sourceUnitDigest": "6b61c92590d902b56c0c6555109c618b9765ff122616e89d0b31721a561c494c",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-87",
  "targetUnitDigest": "6b61c92590d902b56c0c6555109c618b9765ff122616e89d0b31721a561c494c",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "8. Module Boundaries",
    "8.4 Claim Port"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-84 (lines 448–454) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-87 (lines 472–478); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Responsibilities:

- select eligible item using effective view;
- acquire runtime claim atomically;
- create/attach worktree or branch context;
- return claim information to caller;
- avoid durable `work.move -> doing`.
```

### Full target shown text

```text
Responsibilities:

- select eligible item using effective view;
- acquire runtime claim atomically;
- create/attach worktree or branch context;
- return claim information to caller;
- avoid durable `work.move -> doing`.
```

## claim_edf5311ff0fdb600b17368ca2387eb1a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-85, lines 456–456.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-88.
Source digest: 95846e8d9e30850a443d17c648a6354929df2fac3fe1df0ad1ac5cee0f370287
Target digest: 95846e8d9e30850a443d17c648a6354929df2fac3fe1df0ad1ac5cee0f370287
Shown source SHA256: 95846e8d9e30850a443d17c648a6354929df2fac3fe1df0ad1ac5cee0f370287
Shown target SHA256: 95846e8d9e30850a443d17c648a6354929df2fac3fe1df0ad1ac5cee0f370287

### Proposed decision

```json
{
  "claimId": "claim_edf5311ff0fdb600b17368ca2387eb1a",
  "sourceUnitDigest": "95846e8d9e30850a443d17c648a6354929df2fac3fe1df0ad1ac5cee0f370287",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-88",
  "targetUnitDigest": "95846e8d9e30850a443d17c648a6354929df2fac3fe1df0ad1ac5cee0f370287",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "8. Module Boundaries",
    "8.4 Claim Port"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-85 (lines 456–456) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-88 (lines 480–480); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
No caller should implement its own claim eligibility or active-claim write path.
```

### Full target shown text

```text
No caller should implement its own claim eligibility or active-claim write path.
```

## claim_1774b08eae289e6f12aac044f8c89363

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#9-required-flows, lines 458–458.
Target: docs/platform/proposals/doing-coordination-redesign.md#9-required-flows.
Source digest: 09c90fdb17d0735984064d7229daaf5975cff0f11d8434d755d8311704006946
Target digest: 09c90fdb17d0735984064d7229daaf5975cff0f11d8434d755d8311704006946
Shown source SHA256: 372d7a9209d943ee5104b1e7f400ff5bb88ddc5f07ce8289579508c9c4b3bd42
Shown target SHA256: 372d7a9209d943ee5104b1e7f400ff5bb88ddc5f07ce8289579508c9c4b3bd42

### Proposed decision

```json
{
  "claimId": "claim_1774b08eae289e6f12aac044f8c89363",
  "sourceUnitDigest": "09c90fdb17d0735984064d7229daaf5975cff0f11d8434d755d8311704006946",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "9-required-flows",
  "targetUnitDigest": "09c90fdb17d0735984064d7229daaf5975cff0f11d8434d755d8311704006946",
  "targetAncestry": [
    "Doing Coordination Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#9-required-flows (lines 458–458) is carried at docs/platform/proposals/doing-coordination-redesign.md#9-required-flows (lines 482–482); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 9. Required Flows
```

### Full target shown text

```text
## 9. Required Flows
```

## claim_42bafb57d54bc6055db8119f211adce1

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#91-first-claim, lines 460–460.
Target: docs/platform/proposals/doing-coordination-redesign.md#91-first-claim.
Source digest: 01c2b014f8d11d4789fa109c7f6a9643f26a839757050e15a530eefc8b0be4d6
Target digest: 01c2b014f8d11d4789fa109c7f6a9643f26a839757050e15a530eefc8b0be4d6
Shown source SHA256: c6dc903ec467cd209a43007d543641f4eb78d9246d2612840a76bb9d47d91be1
Shown target SHA256: c6dc903ec467cd209a43007d543641f4eb78d9246d2612840a76bb9d47d91be1

### Proposed decision

```json
{
  "claimId": "claim_42bafb57d54bc6055db8119f211adce1",
  "sourceUnitDigest": "01c2b014f8d11d4789fa109c7f6a9643f26a839757050e15a530eefc8b0be4d6",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "91-first-claim",
  "targetUnitDigest": "01c2b014f8d11d4789fa109c7f6a9643f26a839757050e15a530eefc8b0be4d6",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "9. Required Flows"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#91-first-claim (lines 460–460) is carried at docs/platform/proposals/doing-coordination-redesign.md#91-first-claim (lines 484–484); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 9.1 First Claim

```txt
input:
  item status = todo
  attemptCount = 0
  no active claim

steps:
  read durable view
  read runtime claims
  verify effective status is todo
  capture preClaimStatus and preClaimRevision
  write runtime claim
  prepare worktree/branch

durable event writes:
  none for claim-time doing

result:
  durable status = todo
  effective status = doing
  attemptCount = 0 until attempt settles
```

If the implementation wants open attempts to appear in attempt projections before settle, that must be a derived projection from runtime claim, not a committed durable attempt completion.
````

### Full target shown text

````text
### 9.1 First Claim

```txt
input:
  item status = todo
  attemptCount = 0
  no active claim

steps:
  read durable view
  read runtime claims
  verify effective status is todo
  capture preClaimStatus and preClaimRevision
  write runtime claim
  prepare worktree/branch

durable event writes:
  none for claim-time doing

result:
  durable status = todo
  effective status = doing
  attemptCount = 0 until attempt settles
```

If the implementation wants open attempts to appear in attempt projections before settle, that must be a derived projection from runtime claim, not a committed durable attempt completion.
````

## claim_086fced7687f07bbb4970b7971392efb

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-86, lines 462–483.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-89.
Source digest: 39fbac53f5f30a07cda75ef9bfdeac0e43e8c437d4fb432d24d61a4c4d07c029
Target digest: 39fbac53f5f30a07cda75ef9bfdeac0e43e8c437d4fb432d24d61a4c4d07c029
Shown source SHA256: 39fbac53f5f30a07cda75ef9bfdeac0e43e8c437d4fb432d24d61a4c4d07c029
Shown target SHA256: 39fbac53f5f30a07cda75ef9bfdeac0e43e8c437d4fb432d24d61a4c4d07c029

### Proposed decision

```json
{
  "claimId": "claim_086fced7687f07bbb4970b7971392efb",
  "sourceUnitDigest": "39fbac53f5f30a07cda75ef9bfdeac0e43e8c437d4fb432d24d61a4c4d07c029",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-89",
  "targetUnitDigest": "39fbac53f5f30a07cda75ef9bfdeac0e43e8c437d4fb432d24d61a4c4d07c029",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "9. Required Flows",
    "9.1 First Claim"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-86 (lines 462–483) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-89 (lines 486–507); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
input:
  item status = todo
  attemptCount = 0
  no active claim

steps:
  read durable view
  read runtime claims
  verify effective status is todo
  capture preClaimStatus and preClaimRevision
  write runtime claim
  prepare worktree/branch

durable event writes:
  none for claim-time doing

result:
  durable status = todo
  effective status = doing
  attemptCount = 0 until attempt settles
```
````

### Full target shown text

````text
```txt
input:
  item status = todo
  attemptCount = 0
  no active claim

steps:
  read durable view
  read runtime claims
  verify effective status is todo
  capture preClaimStatus and preClaimRevision
  write runtime claim
  prepare worktree/branch

durable event writes:
  none for claim-time doing

result:
  durable status = todo
  effective status = doing
  attemptCount = 0 until attempt settles
```
````

## claim_c6096aeac5e8d711748cbbad8053e85d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-87, lines 485–485.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-90.
Source digest: 3b3b3656eda7af7a4bfed4d625dd151c5a84770ab0ccc587e45808a538f21a6a
Target digest: 3b3b3656eda7af7a4bfed4d625dd151c5a84770ab0ccc587e45808a538f21a6a
Shown source SHA256: 3b3b3656eda7af7a4bfed4d625dd151c5a84770ab0ccc587e45808a538f21a6a
Shown target SHA256: 3b3b3656eda7af7a4bfed4d625dd151c5a84770ab0ccc587e45808a538f21a6a

### Proposed decision

```json
{
  "claimId": "claim_c6096aeac5e8d711748cbbad8053e85d",
  "sourceUnitDigest": "3b3b3656eda7af7a4bfed4d625dd151c5a84770ab0ccc587e45808a538f21a6a",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-90",
  "targetUnitDigest": "3b3b3656eda7af7a4bfed4d625dd151c5a84770ab0ccc587e45808a538f21a6a",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "9. Required Flows",
    "9.1 First Claim"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-87 (lines 485–485) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-90 (lines 509–509); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
If the implementation wants open attempts to appear in attempt projections before settle, that must be a derived projection from runtime claim, not a committed durable attempt completion.
```

### Full target shown text

```text
If the implementation wants open attempts to appear in attempt projections before settle, that must be a derived projection from runtime claim, not a committed durable attempt completion.
```

## claim_c917cc6e9f5e85e7e1bf2c1f2188f339

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#92-successful-return-for-approval, lines 487–487.
Target: docs/platform/proposals/doing-coordination-redesign.md#92-successful-return-for-approval.
Source digest: a575a341fde15cf1d5464cb1b870c6d0294022283b913393125da79ba6220feb
Target digest: a575a341fde15cf1d5464cb1b870c6d0294022283b913393125da79ba6220feb
Shown source SHA256: 2924749f13bbc3fd1a830677cb0065d765615bc843c4e97e207738a34f5d301a
Shown target SHA256: 2924749f13bbc3fd1a830677cb0065d765615bc843c4e97e207738a34f5d301a

### Proposed decision

```json
{
  "claimId": "claim_c917cc6e9f5e85e7e1bf2c1f2188f339",
  "sourceUnitDigest": "a575a341fde15cf1d5464cb1b870c6d0294022283b913393125da79ba6220feb",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "92-successful-return-for-approval",
  "targetUnitDigest": "a575a341fde15cf1d5464cb1b870c6d0294022283b913393125da79ba6220feb",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "9. Required Flows"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#92-successful-return-for-approval (lines 487–487) is carried at docs/platform/proposals/doing-coordination-redesign.md#92-successful-return-for-approval (lines 511–511); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 9.2 Successful Return For Approval

```txt
input:
  active claim exists
  durable item still matches preClaimRevision or accepted reconcile rule

steps:
  validate claim owner and claimId
  validate durable revision
  append durable attempt result=submitted
  append durable workflow move to awaiting-approval
  remove runtime claim
  rebuild durable view

result:
  durable status = awaiting-approval
  effective status = awaiting-approval
  attemptCount increments
```
````

### Full target shown text

````text
### 9.2 Successful Return For Approval

```txt
input:
  active claim exists
  durable item still matches preClaimRevision or accepted reconcile rule

steps:
  validate claim owner and claimId
  validate durable revision
  append durable attempt result=submitted
  append durable workflow move to awaiting-approval
  remove runtime claim
  rebuild durable view

result:
  durable status = awaiting-approval
  effective status = awaiting-approval
  attemptCount increments
```
````

## claim_2d2abbdbadb3ce162a40a821190cef60

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-88, lines 489–506.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-91.
Source digest: 1ca4afb94d485c209d9e026fa732714b3a76cfa9af2b3ebdfc002b8a869bcac1
Target digest: 1ca4afb94d485c209d9e026fa732714b3a76cfa9af2b3ebdfc002b8a869bcac1
Shown source SHA256: 1ca4afb94d485c209d9e026fa732714b3a76cfa9af2b3ebdfc002b8a869bcac1
Shown target SHA256: 1ca4afb94d485c209d9e026fa732714b3a76cfa9af2b3ebdfc002b8a869bcac1

### Proposed decision

```json
{
  "claimId": "claim_2d2abbdbadb3ce162a40a821190cef60",
  "sourceUnitDigest": "1ca4afb94d485c209d9e026fa732714b3a76cfa9af2b3ebdfc002b8a869bcac1",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-91",
  "targetUnitDigest": "1ca4afb94d485c209d9e026fa732714b3a76cfa9af2b3ebdfc002b8a869bcac1",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "9. Required Flows",
    "9.2 Successful Return For Approval"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-88 (lines 489–506) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-91 (lines 513–530); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
input:
  active claim exists
  durable item still matches preClaimRevision or accepted reconcile rule

steps:
  validate claim owner and claimId
  validate durable revision
  append durable attempt result=submitted
  append durable workflow move to awaiting-approval
  remove runtime claim
  rebuild durable view

result:
  durable status = awaiting-approval
  effective status = awaiting-approval
  attemptCount increments
```
````

### Full target shown text

````text
```txt
input:
  active claim exists
  durable item still matches preClaimRevision or accepted reconcile rule

steps:
  validate claim owner and claimId
  validate durable revision
  append durable attempt result=submitted
  append durable workflow move to awaiting-approval
  remove runtime claim
  rebuild durable view

result:
  durable status = awaiting-approval
  effective status = awaiting-approval
  attemptCount increments
```
````

## claim_aab4089ca73f51cf27b05a67d7626957

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#93-verify-fail-park, lines 508–508.
Target: docs/platform/proposals/doing-coordination-redesign.md#93-verify-fail-park.
Source digest: 251780d8e5fc5e17966e15acbe40385b01f8f77782aad28f9503086702929448
Target digest: 251780d8e5fc5e17966e15acbe40385b01f8f77782aad28f9503086702929448
Shown source SHA256: 6afe3b3d8c2b8d53ec31c0da6465d14e6be30adcd9c74d885a9752fadf447b5a
Shown target SHA256: 6afe3b3d8c2b8d53ec31c0da6465d14e6be30adcd9c74d885a9752fadf447b5a

### Proposed decision

```json
{
  "claimId": "claim_aab4089ca73f51cf27b05a67d7626957",
  "sourceUnitDigest": "251780d8e5fc5e17966e15acbe40385b01f8f77782aad28f9503086702929448",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "93-verify-fail-park",
  "targetUnitDigest": "251780d8e5fc5e17966e15acbe40385b01f8f77782aad28f9503086702929448",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "9. Required Flows"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#93-verify-fail-park (lines 508–508) is carried at docs/platform/proposals/doing-coordination-redesign.md#93-verify-fail-park (lines 532–532); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 9.3 Verify Fail Park

```txt
input:
  active claim exists
  verification failed

steps:
  validate claim
  append durable attempt result=verify-failed
  append durable workflow move to blocked or awaiting-human according to existing policy
  remove runtime claim

result:
  item is no longer active doing
  durable status records the stable parked state
  attempt history records the failed execution
```
````

### Full target shown text

````text
### 9.3 Verify Fail Park

```txt
input:
  active claim exists
  verification failed

steps:
  validate claim
  append durable attempt result=verify-failed
  append durable workflow move to blocked or awaiting-human according to existing policy
  remove runtime claim

result:
  item is no longer active doing
  durable status records the stable parked state
  attempt history records the failed execution
```
````

## claim_d64fbe0b30381db3e3d0f8f35220de18

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-89, lines 510–525.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-92.
Source digest: bd81b52f39435c8d249a3dc65f81491b09bdafa5e0bf60cf56fea2ddced0949a
Target digest: bd81b52f39435c8d249a3dc65f81491b09bdafa5e0bf60cf56fea2ddced0949a
Shown source SHA256: bd81b52f39435c8d249a3dc65f81491b09bdafa5e0bf60cf56fea2ddced0949a
Shown target SHA256: bd81b52f39435c8d249a3dc65f81491b09bdafa5e0bf60cf56fea2ddced0949a

### Proposed decision

```json
{
  "claimId": "claim_d64fbe0b30381db3e3d0f8f35220de18",
  "sourceUnitDigest": "bd81b52f39435c8d249a3dc65f81491b09bdafa5e0bf60cf56fea2ddced0949a",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-92",
  "targetUnitDigest": "bd81b52f39435c8d249a3dc65f81491b09bdafa5e0bf60cf56fea2ddced0949a",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "9. Required Flows",
    "9.3 Verify Fail Park"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-89 (lines 510–525) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-92 (lines 534–549); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
input:
  active claim exists
  verification failed

steps:
  validate claim
  append durable attempt result=verify-failed
  append durable workflow move to blocked or awaiting-human according to existing policy
  remove runtime claim

result:
  item is no longer active doing
  durable status records the stable parked state
  attempt history records the failed execution
```
````

### Full target shown text

````text
```txt
input:
  active claim exists
  verification failed

steps:
  validate claim
  append durable attempt result=verify-failed
  append durable workflow move to blocked or awaiting-human according to existing policy
  remove runtime claim

result:
  item is no longer active doing
  durable status records the stable parked state
  attempt history records the failed execution
```
````

## claim_a8e8f25c376552c8b21e6d194cd8ff38

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#94-intentional-release, lines 527–527.
Target: docs/platform/proposals/doing-coordination-redesign.md#94-intentional-release.
Source digest: 3320345d410df77fd88d1a9ba028094536a6a4456fdbffc866a51a8def497413
Target digest: 3320345d410df77fd88d1a9ba028094536a6a4456fdbffc866a51a8def497413
Shown source SHA256: dcc6f21fc046a24e29a67685570716d0dfb56f53e05cac6cd3f89715e0de44fc
Shown target SHA256: dcc6f21fc046a24e29a67685570716d0dfb56f53e05cac6cd3f89715e0de44fc

### Proposed decision

```json
{
  "claimId": "claim_a8e8f25c376552c8b21e6d194cd8ff38",
  "sourceUnitDigest": "3320345d410df77fd88d1a9ba028094536a6a4456fdbffc866a51a8def497413",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "94-intentional-release",
  "targetUnitDigest": "3320345d410df77fd88d1a9ba028094536a6a4456fdbffc866a51a8def497413",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "9. Required Flows"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#94-intentional-release (lines 527–527) is carried at docs/platform/proposals/doing-coordination-redesign.md#94-intentional-release (lines 551–551); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 9.4 Intentional Release

```txt
input:
  active claim exists
  owner chooses to stop without parking/finalizing

steps:
  validate claim
  append durable attempt result=released from=preClaimStatus to=preClaimStatus
  remove runtime claim

result:
  durable status remains todo or the original claimable state
  effective status becomes todo
  attemptCount increments
  hasStarted becomes true
```

This is how a released item differs from a never-started item.
````

### Full target shown text

````text
### 9.4 Intentional Release

```txt
input:
  active claim exists
  owner chooses to stop without parking/finalizing

steps:
  validate claim
  append durable attempt result=released from=preClaimStatus to=preClaimStatus
  remove runtime claim

result:
  durable status remains todo or the original claimable state
  effective status becomes todo
  attemptCount increments
  hasStarted becomes true
```

This is how a released item differs from a never-started item.
````

## claim_22552ecb64177be8bd32772ab957de74

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-90, lines 529–544.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-93.
Source digest: a5051cf8717260584b94ea3b7579d9020b86a77bae0833876e07a2b1e2a77f3b
Target digest: a5051cf8717260584b94ea3b7579d9020b86a77bae0833876e07a2b1e2a77f3b
Shown source SHA256: a5051cf8717260584b94ea3b7579d9020b86a77bae0833876e07a2b1e2a77f3b
Shown target SHA256: a5051cf8717260584b94ea3b7579d9020b86a77bae0833876e07a2b1e2a77f3b

### Proposed decision

```json
{
  "claimId": "claim_22552ecb64177be8bd32772ab957de74",
  "sourceUnitDigest": "a5051cf8717260584b94ea3b7579d9020b86a77bae0833876e07a2b1e2a77f3b",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-93",
  "targetUnitDigest": "a5051cf8717260584b94ea3b7579d9020b86a77bae0833876e07a2b1e2a77f3b",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "9. Required Flows",
    "9.4 Intentional Release"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-90 (lines 529–544) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-93 (lines 553–568); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
input:
  active claim exists
  owner chooses to stop without parking/finalizing

steps:
  validate claim
  append durable attempt result=released from=preClaimStatus to=preClaimStatus
  remove runtime claim

result:
  durable status remains todo or the original claimable state
  effective status becomes todo
  attemptCount increments
  hasStarted becomes true
```
````

### Full target shown text

````text
```txt
input:
  active claim exists
  owner chooses to stop without parking/finalizing

steps:
  validate claim
  append durable attempt result=released from=preClaimStatus to=preClaimStatus
  remove runtime claim

result:
  durable status remains todo or the original claimable state
  effective status becomes todo
  attemptCount increments
  hasStarted becomes true
```
````

## claim_9d51051dc0eb54a9e41a8b9c133f14f5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-91, lines 546–546.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-94.
Source digest: 180ba053549491359e554c4c41a8a3cde24d8f86d5442805f7c03789faabac06
Target digest: 180ba053549491359e554c4c41a8a3cde24d8f86d5442805f7c03789faabac06
Shown source SHA256: 180ba053549491359e554c4c41a8a3cde24d8f86d5442805f7c03789faabac06
Shown target SHA256: 180ba053549491359e554c4c41a8a3cde24d8f86d5442805f7c03789faabac06

### Proposed decision

```json
{
  "claimId": "claim_9d51051dc0eb54a9e41a8b9c133f14f5",
  "sourceUnitDigest": "180ba053549491359e554c4c41a8a3cde24d8f86d5442805f7c03789faabac06",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-94",
  "targetUnitDigest": "180ba053549491359e554c4c41a8a3cde24d8f86d5442805f7c03789faabac06",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "9. Required Flows",
    "9.4 Intentional Release"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-91 (lines 546–546) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-94 (lines 570–570); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
This is how a released item differs from a never-started item.
```

### Full target shown text

```text
This is how a released item differs from a never-started item.
```

## claim_ad94d38a95e13836b03e7a35ca50d07e

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#95-stale-reclaim, lines 548–548.
Target: docs/platform/proposals/doing-coordination-redesign.md#95-stale-reclaim.
Source digest: bccab9f5e2eef22d7742beffe065bf49482c17786af138706caa35e1ba1bd2f3
Target digest: bccab9f5e2eef22d7742beffe065bf49482c17786af138706caa35e1ba1bd2f3
Shown source SHA256: b221dae0f0518995df88137482f18f3296434ace0d7670ee2537af511245d060
Shown target SHA256: b221dae0f0518995df88137482f18f3296434ace0d7670ee2537af511245d060

### Proposed decision

```json
{
  "claimId": "claim_ad94d38a95e13836b03e7a35ca50d07e",
  "sourceUnitDigest": "bccab9f5e2eef22d7742beffe065bf49482c17786af138706caa35e1ba1bd2f3",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "95-stale-reclaim",
  "targetUnitDigest": "bccab9f5e2eef22d7742beffe065bf49482c17786af138706caa35e1ba1bd2f3",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "9. Required Flows"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#95-stale-reclaim (lines 548–548) is carried at docs/platform/proposals/doing-coordination-redesign.md#95-stale-reclaim (lines 572–572); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 9.5 Stale Reclaim

```txt
input:
  active claim exists
  owner appears inactive

steps:
  compute real liveness using worktree/git activity
  use role-specific thresholds
  if reclaim eligible, append durable attempt result=reclaimed
  remove runtime claim

result:
  durable status remains claimable unless policy parks it
  effective status becomes todo or parked
  attempt history records reclaim
```

The primary reclaim decision must use real liveness from worktree activity. A hard expiry is only a backstop for broken clocks, missing worktrees, or pathological stale records.
````

### Full target shown text

````text
### 9.5 Stale Reclaim

```txt
input:
  active claim exists
  owner appears inactive

steps:
  compute real liveness using worktree/git activity
  use role-specific thresholds
  if reclaim eligible, append durable attempt result=reclaimed
  remove runtime claim

result:
  durable status remains claimable unless policy parks it
  effective status becomes todo or parked
  attempt history records reclaim
```

The primary reclaim decision must use real liveness from worktree activity. A hard expiry is only a backstop for broken clocks, missing worktrees, or pathological stale records.
````

## claim_ab2977f63e8da976114c981ac0e4d7ba

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-92, lines 550–565.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-95.
Source digest: 7c3f7c9b1bcda9a95bf95077f479a013066a5bcae00de6d068cebec0851f7f04
Target digest: 7c3f7c9b1bcda9a95bf95077f479a013066a5bcae00de6d068cebec0851f7f04
Shown source SHA256: 7c3f7c9b1bcda9a95bf95077f479a013066a5bcae00de6d068cebec0851f7f04
Shown target SHA256: 7c3f7c9b1bcda9a95bf95077f479a013066a5bcae00de6d068cebec0851f7f04

### Proposed decision

```json
{
  "claimId": "claim_ab2977f63e8da976114c981ac0e4d7ba",
  "sourceUnitDigest": "7c3f7c9b1bcda9a95bf95077f479a013066a5bcae00de6d068cebec0851f7f04",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-95",
  "targetUnitDigest": "7c3f7c9b1bcda9a95bf95077f479a013066a5bcae00de6d068cebec0851f7f04",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "9. Required Flows",
    "9.5 Stale Reclaim"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-92 (lines 550–565) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-95 (lines 574–589); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
input:
  active claim exists
  owner appears inactive

steps:
  compute real liveness using worktree/git activity
  use role-specific thresholds
  if reclaim eligible, append durable attempt result=reclaimed
  remove runtime claim

result:
  durable status remains claimable unless policy parks it
  effective status becomes todo or parked
  attempt history records reclaim
```
````

### Full target shown text

````text
```txt
input:
  active claim exists
  owner appears inactive

steps:
  compute real liveness using worktree/git activity
  use role-specific thresholds
  if reclaim eligible, append durable attempt result=reclaimed
  remove runtime claim

result:
  durable status remains claimable unless policy parks it
  effective status becomes todo or parked
  attempt history records reclaim
```
````

## claim_0f8e23470b7abe78e5d28af37a8d30b9

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-93, lines 567–567.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-96.
Source digest: d59ed0fc18c2044d1ae20d16854ddd15765d66110ebaaa62bd5260176da6b6d6
Target digest: d59ed0fc18c2044d1ae20d16854ddd15765d66110ebaaa62bd5260176da6b6d6
Shown source SHA256: d59ed0fc18c2044d1ae20d16854ddd15765d66110ebaaa62bd5260176da6b6d6
Shown target SHA256: d59ed0fc18c2044d1ae20d16854ddd15765d66110ebaaa62bd5260176da6b6d6

### Proposed decision

```json
{
  "claimId": "claim_0f8e23470b7abe78e5d28af37a8d30b9",
  "sourceUnitDigest": "d59ed0fc18c2044d1ae20d16854ddd15765d66110ebaaa62bd5260176da6b6d6",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-96",
  "targetUnitDigest": "d59ed0fc18c2044d1ae20d16854ddd15765d66110ebaaa62bd5260176da6b6d6",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "9. Required Flows",
    "9.5 Stale Reclaim"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-93 (lines 567–567) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-96 (lines 591–591); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The primary reclaim decision must use real liveness from worktree activity. A hard expiry is only a backstop for broken clocks, missing worktrees, or pathological stale records.
```

### Full target shown text

```text
The primary reclaim decision must use real liveness from worktree activity. A hard expiry is only a backstop for broken clocks, missing worktrees, or pathological stale records.
```

## claim_9a9f9e6c9304e36af86e4dd86cdc4b76

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#96-planning-to-executing, lines 569–569.
Target: docs/platform/proposals/doing-coordination-redesign.md#96-planning-to-executing.
Source digest: b562e1f9d958bb6f18b21772c5bb5116c03b41b43381aeb2b7f10ed730554898
Target digest: b562e1f9d958bb6f18b21772c5bb5116c03b41b43381aeb2b7f10ed730554898
Shown source SHA256: b5cfe7e97a9ba4b905e4afdbb9a58a966b639d31021e63b80a7eb5f6e2c65203
Shown target SHA256: b5cfe7e97a9ba4b905e4afdbb9a58a966b639d31021e63b80a7eb5f6e2c65203

### Proposed decision

```json
{
  "claimId": "claim_9a9f9e6c9304e36af86e4dd86cdc4b76",
  "sourceUnitDigest": "b562e1f9d958bb6f18b21772c5bb5116c03b41b43381aeb2b7f10ed730554898",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "96-planning-to-executing",
  "targetUnitDigest": "b562e1f9d958bb6f18b21772c5bb5116c03b41b43381aeb2b7f10ed730554898",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "9. Required Flows"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#96-planning-to-executing (lines 569–569) is carried at docs/platform/proposals/doing-coordination-redesign.md#96-planning-to-executing (lines 593–593); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 9.6 Planning To Executing

Current claim-lock behavior releases durable `doing` when an item moves from planning to executing so the driving loop can re-claim it.

In the new model:

- there is no durable `doing` to release;
- the runtime claim may remain active across clarify, planning, and executing if the same owner/session is still valid;
- `releaseClaimOnExecuting` should be retired or made an internal no-op as part of the hard cut;
- an actual pause/release must be represented as an intentional release flow, not as a hidden durable status bounce.
```

### Full target shown text

```text
### 9.6 Planning To Executing

Current claim-lock behavior releases durable `doing` when an item moves from planning to executing so the driving loop can re-claim it.

In the new model:

- there is no durable `doing` to release;
- the runtime claim may remain active across clarify, planning, and executing if the same owner/session is still valid;
- `releaseClaimOnExecuting` should be retired or made an internal no-op as part of the hard cut;
- an actual pause/release must be represented as an intentional release flow, not as a hidden durable status bounce.
```

## claim_ac575a3606c9bde77b0cc73eb32ce0a2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-94, lines 571–571.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-97.
Source digest: ad50edf6bcec3d9e478a4a332e1e739340e4c159aecdd2025d356a526a61bd5c
Target digest: ad50edf6bcec3d9e478a4a332e1e739340e4c159aecdd2025d356a526a61bd5c
Shown source SHA256: ad50edf6bcec3d9e478a4a332e1e739340e4c159aecdd2025d356a526a61bd5c
Shown target SHA256: ad50edf6bcec3d9e478a4a332e1e739340e4c159aecdd2025d356a526a61bd5c

### Proposed decision

```json
{
  "claimId": "claim_ac575a3606c9bde77b0cc73eb32ce0a2",
  "sourceUnitDigest": "ad50edf6bcec3d9e478a4a332e1e739340e4c159aecdd2025d356a526a61bd5c",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-97",
  "targetUnitDigest": "ad50edf6bcec3d9e478a4a332e1e739340e4c159aecdd2025d356a526a61bd5c",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "9. Required Flows",
    "9.6 Planning To Executing"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-94 (lines 571–571) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-97 (lines 595–595); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Current claim-lock behavior releases durable `doing` when an item moves from planning to executing so the driving loop can re-claim it.
```

### Full target shown text

```text
Current claim-lock behavior releases durable `doing` when an item moves from planning to executing so the driving loop can re-claim it.
```

## claim_0877c77578ddf8ce2f37711ddead476b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-95, lines 573–578.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-98.
Source digest: 1df9492ea17e47e4af710fc1e752bd6d42b399357822e16731f3ba9333566d92
Target digest: 1df9492ea17e47e4af710fc1e752bd6d42b399357822e16731f3ba9333566d92
Shown source SHA256: 1df9492ea17e47e4af710fc1e752bd6d42b399357822e16731f3ba9333566d92
Shown target SHA256: 1df9492ea17e47e4af710fc1e752bd6d42b399357822e16731f3ba9333566d92

### Proposed decision

```json
{
  "claimId": "claim_0877c77578ddf8ce2f37711ddead476b",
  "sourceUnitDigest": "1df9492ea17e47e4af710fc1e752bd6d42b399357822e16731f3ba9333566d92",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-98",
  "targetUnitDigest": "1df9492ea17e47e4af710fc1e752bd6d42b399357822e16731f3ba9333566d92",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "9. Required Flows",
    "9.6 Planning To Executing"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-95 (lines 573–578) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-98 (lines 597–602); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
In the new model:

- there is no durable `doing` to release;
- the runtime claim may remain active across clarify, planning, and executing if the same owner/session is still valid;
- `releaseClaimOnExecuting` should be retired or made an internal no-op as part of the hard cut;
- an actual pause/release must be represented as an intentional release flow, not as a hidden durable status bounce.
```

### Full target shown text

```text
In the new model:

- there is no durable `doing` to release;
- the runtime claim may remain active across clarify, planning, and executing if the same owner/session is still valid;
- `releaseClaimOnExecuting` should be retired or made an internal no-op as part of the hard cut;
- an actual pause/release must be represented as an intentional release flow, not as a hidden durable status bounce.
```

## claim_8626ac0fa7ffa64e8d9e454c1dbc3d48

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#97-ask-and-answer-while-claimed, lines 580–580.
Target: docs/platform/proposals/doing-coordination-redesign.md#97-ask-and-answer-while-claimed.
Source digest: 490ed17d3b9783fff985b1f9117a5c3dc77a818de55262d1d9b88d90becc715a
Target digest: 490ed17d3b9783fff985b1f9117a5c3dc77a818de55262d1d9b88d90becc715a
Shown source SHA256: 716626fd9fdfcdd0a1dff58e0f2f4df22b0cef72d750f64988382e434f7e2b93
Shown target SHA256: 716626fd9fdfcdd0a1dff58e0f2f4df22b0cef72d750f64988382e434f7e2b93

### Proposed decision

```json
{
  "claimId": "claim_8626ac0fa7ffa64e8d9e454c1dbc3d48",
  "sourceUnitDigest": "490ed17d3b9783fff985b1f9117a5c3dc77a818de55262d1d9b88d90becc715a",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "97-ask-and-answer-while-claimed",
  "targetUnitDigest": "490ed17d3b9783fff985b1f9117a5c3dc77a818de55262d1d9b88d90becc715a",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "9. Required Flows"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#97-ask-and-answer-while-claimed (lines 580–580) is carried at docs/platform/proposals/doing-coordination-redesign.md#97-ask-and-answer-while-claimed (lines 604–604); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
### 9.7 Ask And Answer While Claimed

```txt
input:
  active claim exists
  durable status = todo or another claimable base
  effective status = doing
  the owner needs a human answer before continuing

ask steps:
  validate the active claim if the ask is claim-owned
  record the durable base status, not the effective doing status
  append durable attempt result=paused if this ask ends an active claim
  append durable workflow move from durable base to awaiting-human
  release the active claim, or mark it paused in a non-active coordination record

ask result:
  durable status = awaiting-human
  effective status = awaiting-human
  no active worker slot is consumed
  reclaim does not treat the item as active doing

answer steps:
  append durable answer
  move durable status from awaiting-human to the recorded durable base or another stable policy target
  do not move durable status to doing
  if work should continue immediately, acquire a fresh runtime claim after the durable answer

answer result without immediate reclaim:
  durable status = todo or other stable target
  effective status = same stable target

answer result with immediate runtime claim:
  durable status = todo or other stable target
  effective status = doing
```

The answer path must never use `statusAtAsk: "doing"` as a durable resume target.
If the UI wants to remember that the item was visually `doing` when the question
was asked, that field must be display/audit metadata only. The durable resume
target must be the durable base captured by the claim or by the ask operation.
````

### Full target shown text

````text
### 9.7 Ask And Answer While Claimed

```txt
input:
  active claim exists
  durable status = todo or another claimable base
  effective status = doing
  the owner needs a human answer before continuing

ask steps:
  validate the active claim if the ask is claim-owned
  record the durable base status, not the effective doing status
  append durable attempt result=paused if this ask ends an active claim
  append durable workflow move from durable base to awaiting-human
  release the active claim, or mark it paused in a non-active coordination record

ask result:
  durable status = awaiting-human
  effective status = awaiting-human
  no active worker slot is consumed
  reclaim does not treat the item as active doing

answer steps:
  append durable answer
  move durable status from awaiting-human to the recorded durable base or another stable policy target
  do not move durable status to doing
  if work should continue immediately, acquire a fresh runtime claim after the durable answer

answer result without immediate reclaim:
  durable status = todo or other stable target
  effective status = same stable target

answer result with immediate runtime claim:
  durable status = todo or other stable target
  effective status = doing
```

The answer path must never use `statusAtAsk: "doing"` as a durable resume target.
If the UI wants to remember that the item was visually `doing` when the question
was asked, that field must be display/audit metadata only. The durable resume
target must be the durable base captured by the claim or by the ask operation.
````

## claim_c95d4735dddd7eb4806d1109d0767ce7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-96, lines 582–615.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-99.
Source digest: ef5366a07cf8ac02077d7d7790c4fdd1c08c846adc372a5f6868d8c4e02efd9b
Target digest: ef5366a07cf8ac02077d7d7790c4fdd1c08c846adc372a5f6868d8c4e02efd9b
Shown source SHA256: ef5366a07cf8ac02077d7d7790c4fdd1c08c846adc372a5f6868d8c4e02efd9b
Shown target SHA256: ef5366a07cf8ac02077d7d7790c4fdd1c08c846adc372a5f6868d8c4e02efd9b

### Proposed decision

```json
{
  "claimId": "claim_c95d4735dddd7eb4806d1109d0767ce7",
  "sourceUnitDigest": "ef5366a07cf8ac02077d7d7790c4fdd1c08c846adc372a5f6868d8c4e02efd9b",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-99",
  "targetUnitDigest": "ef5366a07cf8ac02077d7d7790c4fdd1c08c846adc372a5f6868d8c4e02efd9b",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "9. Required Flows",
    "9.7 Ask And Answer While Claimed"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-96 (lines 582–615) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-99 (lines 606–639); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
input:
  active claim exists
  durable status = todo or another claimable base
  effective status = doing
  the owner needs a human answer before continuing

ask steps:
  validate the active claim if the ask is claim-owned
  record the durable base status, not the effective doing status
  append durable attempt result=paused if this ask ends an active claim
  append durable workflow move from durable base to awaiting-human
  release the active claim, or mark it paused in a non-active coordination record

ask result:
  durable status = awaiting-human
  effective status = awaiting-human
  no active worker slot is consumed
  reclaim does not treat the item as active doing

answer steps:
  append durable answer
  move durable status from awaiting-human to the recorded durable base or another stable policy target
  do not move durable status to doing
  if work should continue immediately, acquire a fresh runtime claim after the durable answer

answer result without immediate reclaim:
  durable status = todo or other stable target
  effective status = same stable target

answer result with immediate runtime claim:
  durable status = todo or other stable target
  effective status = doing
```
````

### Full target shown text

````text
```txt
input:
  active claim exists
  durable status = todo or another claimable base
  effective status = doing
  the owner needs a human answer before continuing

ask steps:
  validate the active claim if the ask is claim-owned
  record the durable base status, not the effective doing status
  append durable attempt result=paused if this ask ends an active claim
  append durable workflow move from durable base to awaiting-human
  release the active claim, or mark it paused in a non-active coordination record

ask result:
  durable status = awaiting-human
  effective status = awaiting-human
  no active worker slot is consumed
  reclaim does not treat the item as active doing

answer steps:
  append durable answer
  move durable status from awaiting-human to the recorded durable base or another stable policy target
  do not move durable status to doing
  if work should continue immediately, acquire a fresh runtime claim after the durable answer

answer result without immediate reclaim:
  durable status = todo or other stable target
  effective status = same stable target

answer result with immediate runtime claim:
  durable status = todo or other stable target
  effective status = doing
```
````

## claim_adaa02524b2389d5ec2226b764a92483

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-97, lines 617–620.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-100.
Source digest: 3062a43d881abd80e49c5161da5e2b6653dca2c68220cdd8c595004df3e26307
Target digest: 3062a43d881abd80e49c5161da5e2b6653dca2c68220cdd8c595004df3e26307
Shown source SHA256: 3062a43d881abd80e49c5161da5e2b6653dca2c68220cdd8c595004df3e26307
Shown target SHA256: 3062a43d881abd80e49c5161da5e2b6653dca2c68220cdd8c595004df3e26307

### Proposed decision

```json
{
  "claimId": "claim_adaa02524b2389d5ec2226b764a92483",
  "sourceUnitDigest": "3062a43d881abd80e49c5161da5e2b6653dca2c68220cdd8c595004df3e26307",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-100",
  "targetUnitDigest": "3062a43d881abd80e49c5161da5e2b6653dca2c68220cdd8c595004df3e26307",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "9. Required Flows",
    "9.7 Ask And Answer While Claimed"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-97 (lines 617–620) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-100 (lines 641–644); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
The answer path must never use `statusAtAsk: "doing"` as a durable resume target.
If the UI wants to remember that the item was visually `doing` when the question
was asked, that field must be display/audit metadata only. The durable resume
target must be the durable base captured by the claim or by the ask operation.
```

### Full target shown text

```text
The answer path must never use `statusAtAsk: "doing"` as a durable resume target.
If the UI wants to remember that the item was visually `doing` when the question
was asked, that field must be display/audit metadata only. The durable resume
target must be the durable base captured by the claim or by the ask operation.
```

## claim_3bab946954aec39b48d9a12d254ffcaa

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#10-file-ownership-and-git-policy, lines 622–622.
Target: docs/platform/proposals/doing-coordination-redesign.md#10-file-ownership-and-git-policy.
Source digest: 53f09dfc66355e7a81d74e6b3375986d01f9718c94636a5bc55d9f49fb08b76b
Target digest: 53f09dfc66355e7a81d74e6b3375986d01f9718c94636a5bc55d9f49fb08b76b
Shown source SHA256: b8e20e644b07e0025427ff2d70ac65deabef52fb1042a1ae5d64a6219ba7e4f8
Shown target SHA256: b8e20e644b07e0025427ff2d70ac65deabef52fb1042a1ae5d64a6219ba7e4f8

### Proposed decision

```json
{
  "claimId": "claim_3bab946954aec39b48d9a12d254ffcaa",
  "sourceUnitDigest": "53f09dfc66355e7a81d74e6b3375986d01f9718c94636a5bc55d9f49fb08b76b",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "10-file-ownership-and-git-policy",
  "targetUnitDigest": "53f09dfc66355e7a81d74e6b3375986d01f9718c94636a5bc55d9f49fb08b76b",
  "targetAncestry": [
    "Doing Coordination Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#10-file-ownership-and-git-policy (lines 622–622) is carried at docs/platform/proposals/doing-coordination-redesign.md#10-file-ownership-and-git-policy (lines 646–646); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 10. File Ownership And Git Policy
```

### Full target shown text

```text
## 10. File Ownership And Git Policy
```

## claim_13f7e4f1541f33cfbff5525fe33edd0a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#101-committed-durable-files, lines 624–624.
Target: docs/platform/proposals/doing-coordination-redesign.md#101-committed-durable-files.
Source digest: 61a87d228d8ef51c0a9a35d987f24fba80e2e88d153c23ca4ef6014047390e1a
Target digest: 61a87d228d8ef51c0a9a35d987f24fba80e2e88d153c23ca4ef6014047390e1a
Shown source SHA256: 5f21a82895d8d978c316aa7d1624dab9ee897c494ad516b17286e5a7c9fb5f31
Shown target SHA256: 5f21a82895d8d978c316aa7d1624dab9ee897c494ad516b17286e5a7c9fb5f31

### Proposed decision

```json
{
  "claimId": "claim_13f7e4f1541f33cfbff5525fe33edd0a",
  "sourceUnitDigest": "61a87d228d8ef51c0a9a35d987f24fba80e2e88d153c23ca4ef6014047390e1a",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "101-committed-durable-files",
  "targetUnitDigest": "61a87d228d8ef51c0a9a35d987f24fba80e2e88d153c23ca4ef6014047390e1a",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "10. File Ownership And Git Policy"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#101-committed-durable-files (lines 624–624) is carried at docs/platform/proposals/doing-coordination-redesign.md#101-committed-durable-files (lines 648–648); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 10.1 Committed Durable Files

Commit durable event logs and configuration that represent project truth.

Expected committed `.fgos` classes:

- `.fgos/events.jsonl` baseline if still retained;
- `.fgos/events/*.jsonl` durable event shards;
- `.fgos/config.json`;
- `.fgos/coexistence.json`;
- `.fgos/gate-bypass.json`.

Durable event writes should happen at meaningful workflow settlement points, not at every live claim heartbeat.
```

### Full target shown text

```text
### 10.1 Committed Durable Files

Commit durable event logs and configuration that represent project truth.

Expected committed `.fgos` classes:

- `.fgos/events.jsonl` baseline if still retained;
- `.fgos/events/*.jsonl` durable event shards;
- `.fgos/config.json`;
- `.fgos/coexistence.json`;
- `.fgos/gate-bypass.json`.

Durable event writes should happen at meaningful workflow settlement points, not at every live claim heartbeat.
```

## claim_7f96022af9eccad1106881fcb615f6f5

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-98, lines 626–626.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-101.
Source digest: ec4c15230fb3848bf7ab18d7dc7cf77429d97fce1129cc3fe1008c0b650b183c
Target digest: ec4c15230fb3848bf7ab18d7dc7cf77429d97fce1129cc3fe1008c0b650b183c
Shown source SHA256: ec4c15230fb3848bf7ab18d7dc7cf77429d97fce1129cc3fe1008c0b650b183c
Shown target SHA256: ec4c15230fb3848bf7ab18d7dc7cf77429d97fce1129cc3fe1008c0b650b183c

### Proposed decision

```json
{
  "claimId": "claim_7f96022af9eccad1106881fcb615f6f5",
  "sourceUnitDigest": "ec4c15230fb3848bf7ab18d7dc7cf77429d97fce1129cc3fe1008c0b650b183c",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-101",
  "targetUnitDigest": "ec4c15230fb3848bf7ab18d7dc7cf77429d97fce1129cc3fe1008c0b650b183c",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "10. File Ownership And Git Policy",
    "10.1 Committed Durable Files"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-98 (lines 626–626) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-101 (lines 650–650); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Commit durable event logs and configuration that represent project truth.
```

### Full target shown text

```text
Commit durable event logs and configuration that represent project truth.
```

## claim_97031e50dee70a1382c6af45d1c7e9da

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-99, lines 628–628.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-102.
Source digest: 8786d002f88a52c1fae4f9ba11cf373450afcc97233f1b136d23cb6f9845a1ec
Target digest: 8786d002f88a52c1fae4f9ba11cf373450afcc97233f1b136d23cb6f9845a1ec
Shown source SHA256: 8786d002f88a52c1fae4f9ba11cf373450afcc97233f1b136d23cb6f9845a1ec
Shown target SHA256: 8786d002f88a52c1fae4f9ba11cf373450afcc97233f1b136d23cb6f9845a1ec

### Proposed decision

```json
{
  "claimId": "claim_97031e50dee70a1382c6af45d1c7e9da",
  "sourceUnitDigest": "8786d002f88a52c1fae4f9ba11cf373450afcc97233f1b136d23cb6f9845a1ec",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-102",
  "targetUnitDigest": "8786d002f88a52c1fae4f9ba11cf373450afcc97233f1b136d23cb6f9845a1ec",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "10. File Ownership And Git Policy",
    "10.1 Committed Durable Files"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-99 (lines 628–628) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-102 (lines 652–652); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Expected committed `.fgos` classes:
```

### Full target shown text

```text
Expected committed `.fgos` classes:
```

## claim_a3a7cb888cc13b2fda68419be97d3d59

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-100, lines 630–634.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-103.
Source digest: cefeeafb2688971b6805b6d15972bb2589c31b89cf07b3cf34c501151f16198f
Target digest: cefeeafb2688971b6805b6d15972bb2589c31b89cf07b3cf34c501151f16198f
Shown source SHA256: cefeeafb2688971b6805b6d15972bb2589c31b89cf07b3cf34c501151f16198f
Shown target SHA256: cefeeafb2688971b6805b6d15972bb2589c31b89cf07b3cf34c501151f16198f

### Proposed decision

```json
{
  "claimId": "claim_a3a7cb888cc13b2fda68419be97d3d59",
  "sourceUnitDigest": "cefeeafb2688971b6805b6d15972bb2589c31b89cf07b3cf34c501151f16198f",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-103",
  "targetUnitDigest": "cefeeafb2688971b6805b6d15972bb2589c31b89cf07b3cf34c501151f16198f",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "10. File Ownership And Git Policy",
    "10.1 Committed Durable Files"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-100 (lines 630–634) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-103 (lines 654–658); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- `.fgos/events.jsonl` baseline if still retained;
- `.fgos/events/*.jsonl` durable event shards;
- `.fgos/config.json`;
- `.fgos/coexistence.json`;
- `.fgos/gate-bypass.json`.
```

### Full target shown text

```text
- `.fgos/events.jsonl` baseline if still retained;
- `.fgos/events/*.jsonl` durable event shards;
- `.fgos/config.json`;
- `.fgos/coexistence.json`;
- `.fgos/gate-bypass.json`.
```

## claim_ba0958f92024752bcf67e9a5c9bd4748

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-101, lines 636–636.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-104.
Source digest: 3b96e0de4cdeacbfb7325453947d4ad33e10b0aed8c36a86766352ad9f0be808
Target digest: 3b96e0de4cdeacbfb7325453947d4ad33e10b0aed8c36a86766352ad9f0be808
Shown source SHA256: 3b96e0de4cdeacbfb7325453947d4ad33e10b0aed8c36a86766352ad9f0be808
Shown target SHA256: 3b96e0de4cdeacbfb7325453947d4ad33e10b0aed8c36a86766352ad9f0be808

### Proposed decision

```json
{
  "claimId": "claim_ba0958f92024752bcf67e9a5c9bd4748",
  "sourceUnitDigest": "3b96e0de4cdeacbfb7325453947d4ad33e10b0aed8c36a86766352ad9f0be808",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-104",
  "targetUnitDigest": "3b96e0de4cdeacbfb7325453947d4ad33e10b0aed8c36a86766352ad9f0be808",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "10. File Ownership And Git Policy",
    "10.1 Committed Durable Files"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-101 (lines 636–636) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-104 (lines 660–660); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Durable event writes should happen at meaningful workflow settlement points, not at every live claim heartbeat.
```

### Full target shown text

```text
Durable event writes should happen at meaningful workflow settlement points, not at every live claim heartbeat.
```

## claim_439e5c128931d32e587f97bdd2ea8313

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#102-ignored-derived-or-runtime-files, lines 638–638.
Target: docs/platform/proposals/doing-coordination-redesign.md#102-ignored-derived-or-runtime-files.
Source digest: 7d9ff869fcb640ee15501f84929f3c16d2b209f5c04591ed06e78773ee103b84
Target digest: 7d9ff869fcb640ee15501f84929f3c16d2b209f5c04591ed06e78773ee103b84
Shown source SHA256: 39c2c227ba7498e4e704848594c019c0c34789462dfc2a521d2c5d29b48c60e2
Shown target SHA256: 39c2c227ba7498e4e704848594c019c0c34789462dfc2a521d2c5d29b48c60e2

### Proposed decision

```json
{
  "claimId": "claim_439e5c128931d32e587f97bdd2ea8313",
  "sourceUnitDigest": "7d9ff869fcb640ee15501f84929f3c16d2b209f5c04591ed06e78773ee103b84",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "102-ignored-derived-or-runtime-files",
  "targetUnitDigest": "7d9ff869fcb640ee15501f84929f3c16d2b209f5c04591ed06e78773ee103b84",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "10. File Ownership And Git Policy"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#102-ignored-derived-or-runtime-files (lines 638–638) is carried at docs/platform/proposals/doing-coordination-redesign.md#102-ignored-derived-or-runtime-files (lines 662–662); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 10.2 Ignored Derived Or Runtime Files

Ignore files that are derived, diagnostic, or live coordination.

Expected ignored `.fgos` classes:

- `.fgos/cache/state.json`;
- `.fgos/runtime/**`;
- `.fgos/logs/**`;
- `.fgos/sessions.json`;
- `.fgos/*.lock`;
- active claim files or claim indexes;
- diagnostic logs such as approval faults, guard warnings, changelog nag history, entropy history, invocation faults.

These files may help local operation and debugging, but they must not be merge surfaces on `main`.
```

### Full target shown text

```text
### 10.2 Ignored Derived Or Runtime Files

Ignore files that are derived, diagnostic, or live coordination.

Expected ignored `.fgos` classes:

- `.fgos/cache/state.json`;
- `.fgos/runtime/**`;
- `.fgos/logs/**`;
- `.fgos/sessions.json`;
- `.fgos/*.lock`;
- active claim files or claim indexes;
- diagnostic logs such as approval faults, guard warnings, changelog nag history, entropy history, invocation faults.

These files may help local operation and debugging, but they must not be merge surfaces on `main`.
```

## claim_7e389fea9bf7cefff256aec6e0e15da3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-102, lines 640–640.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-105.
Source digest: 527467874de84c74581438290894ef26116613fead454b0df7a35849559e74a6
Target digest: 527467874de84c74581438290894ef26116613fead454b0df7a35849559e74a6
Shown source SHA256: 527467874de84c74581438290894ef26116613fead454b0df7a35849559e74a6
Shown target SHA256: 527467874de84c74581438290894ef26116613fead454b0df7a35849559e74a6

### Proposed decision

```json
{
  "claimId": "claim_7e389fea9bf7cefff256aec6e0e15da3",
  "sourceUnitDigest": "527467874de84c74581438290894ef26116613fead454b0df7a35849559e74a6",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-105",
  "targetUnitDigest": "527467874de84c74581438290894ef26116613fead454b0df7a35849559e74a6",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "10. File Ownership And Git Policy",
    "10.2 Ignored Derived Or Runtime Files"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-102 (lines 640–640) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-105 (lines 664–664); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Ignore files that are derived, diagnostic, or live coordination.
```

### Full target shown text

```text
Ignore files that are derived, diagnostic, or live coordination.
```

## claim_8a357b997e84868f9e22551efdc897d8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-103, lines 642–642.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-106.
Source digest: c72b52e41ef8d721abdb2d64952511105602168f6d04866a82e73b39e3b147b2
Target digest: c72b52e41ef8d721abdb2d64952511105602168f6d04866a82e73b39e3b147b2
Shown source SHA256: c72b52e41ef8d721abdb2d64952511105602168f6d04866a82e73b39e3b147b2
Shown target SHA256: c72b52e41ef8d721abdb2d64952511105602168f6d04866a82e73b39e3b147b2

### Proposed decision

```json
{
  "claimId": "claim_8a357b997e84868f9e22551efdc897d8",
  "sourceUnitDigest": "c72b52e41ef8d721abdb2d64952511105602168f6d04866a82e73b39e3b147b2",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-106",
  "targetUnitDigest": "c72b52e41ef8d721abdb2d64952511105602168f6d04866a82e73b39e3b147b2",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "10. File Ownership And Git Policy",
    "10.2 Ignored Derived Or Runtime Files"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-103 (lines 642–642) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-106 (lines 666–666); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Expected ignored `.fgos` classes:
```

### Full target shown text

```text
Expected ignored `.fgos` classes:
```

## claim_51afbddf501d5ba6983db8c605c1fabe

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-104, lines 644–650.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-107.
Source digest: bc23e48c4057b4fa6222933523ecc7358bb6d23b4f7a74ccf4ae15f396a0a698
Target digest: bc23e48c4057b4fa6222933523ecc7358bb6d23b4f7a74ccf4ae15f396a0a698
Shown source SHA256: bc23e48c4057b4fa6222933523ecc7358bb6d23b4f7a74ccf4ae15f396a0a698
Shown target SHA256: bc23e48c4057b4fa6222933523ecc7358bb6d23b4f7a74ccf4ae15f396a0a698

### Proposed decision

```json
{
  "claimId": "claim_51afbddf501d5ba6983db8c605c1fabe",
  "sourceUnitDigest": "bc23e48c4057b4fa6222933523ecc7358bb6d23b4f7a74ccf4ae15f396a0a698",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-107",
  "targetUnitDigest": "bc23e48c4057b4fa6222933523ecc7358bb6d23b4f7a74ccf4ae15f396a0a698",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "10. File Ownership And Git Policy",
    "10.2 Ignored Derived Or Runtime Files"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-104 (lines 644–650) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-107 (lines 668–674); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- `.fgos/cache/state.json`;
- `.fgos/runtime/**`;
- `.fgos/logs/**`;
- `.fgos/sessions.json`;
- `.fgos/*.lock`;
- active claim files or claim indexes;
- diagnostic logs such as approval faults, guard warnings, changelog nag history, entropy history, invocation faults.
```

### Full target shown text

```text
- `.fgos/cache/state.json`;
- `.fgos/runtime/**`;
- `.fgos/logs/**`;
- `.fgos/sessions.json`;
- `.fgos/*.lock`;
- active claim files or claim indexes;
- diagnostic logs such as approval faults, guard warnings, changelog nag history, entropy history, invocation faults.
```

## claim_206dc1f1d51f0608747e0944e22fc469

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-105, lines 652–652.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-108.
Source digest: 221e42805abdbadde72f69a32223ff6bfa4bd173ca1b36067cb9922db225bc98
Target digest: 221e42805abdbadde72f69a32223ff6bfa4bd173ca1b36067cb9922db225bc98
Shown source SHA256: 221e42805abdbadde72f69a32223ff6bfa4bd173ca1b36067cb9922db225bc98
Shown target SHA256: 221e42805abdbadde72f69a32223ff6bfa4bd173ca1b36067cb9922db225bc98

### Proposed decision

```json
{
  "claimId": "claim_206dc1f1d51f0608747e0944e22fc469",
  "sourceUnitDigest": "221e42805abdbadde72f69a32223ff6bfa4bd173ca1b36067cb9922db225bc98",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-108",
  "targetUnitDigest": "221e42805abdbadde72f69a32223ff6bfa4bd173ca1b36067cb9922db225bc98",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "10. File Ownership And Git Policy",
    "10.2 Ignored Derived Or Runtime Files"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-105 (lines 652–652) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-108 (lines 676–676); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
These files may help local operation and debugging, but they must not be merge surfaces on `main`.
```

### Full target shown text

```text
These files may help local operation and debugging, but they must not be merge surfaces on `main`.
```

## claim_3f171a3fcd5ed938ed52311660d3a9bd

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#11-cas-and-concurrency-rules, lines 654–654.
Target: docs/platform/proposals/doing-coordination-redesign.md#11-cas-and-concurrency-rules.
Source digest: 4763ed06f186297cdfb2ba1d6e883f46a6444c973f9bd65ac00cf379bc29f588
Target digest: 4763ed06f186297cdfb2ba1d6e883f46a6444c973f9bd65ac00cf379bc29f588
Shown source SHA256: ca9b55fd8a54e6671adfbc477fd0cd10dd48054a2731cf2df031906ae94fd9fd
Shown target SHA256: ca9b55fd8a54e6671adfbc477fd0cd10dd48054a2731cf2df031906ae94fd9fd

### Proposed decision

```json
{
  "claimId": "claim_3f171a3fcd5ed938ed52311660d3a9bd",
  "sourceUnitDigest": "4763ed06f186297cdfb2ba1d6e883f46a6444c973f9bd65ac00cf379bc29f588",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "11-cas-and-concurrency-rules",
  "targetUnitDigest": "4763ed06f186297cdfb2ba1d6e883f46a6444c973f9bd65ac00cf379bc29f588",
  "targetAncestry": [
    "Doing Coordination Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#11-cas-and-concurrency-rules (lines 654–654) is carried at docs/platform/proposals/doing-coordination-redesign.md#11-cas-and-concurrency-rules (lines 678–678); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 11. CAS And Concurrency Rules
```

### Full target shown text

```text
## 11. CAS And Concurrency Rules
```

## claim_a27fdf3730c85b2e72d6d01bb00aea86

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#111-claim-acquire, lines 656–656.
Target: docs/platform/proposals/doing-coordination-redesign.md#111-claim-acquire.
Source digest: 131235273a187bf0c86e351adc6f91ca35874ae37fefc518e2ac6cdb3d109735
Target digest: 131235273a187bf0c86e351adc6f91ca35874ae37fefc518e2ac6cdb3d109735
Shown source SHA256: 93acc9666100adea743dc3897fc07f7e74714d0a69897c29a34fc2aba804c1f8
Shown target SHA256: 93acc9666100adea743dc3897fc07f7e74714d0a69897c29a34fc2aba804c1f8

### Proposed decision

```json
{
  "claimId": "claim_a27fdf3730c85b2e72d6d01bb00aea86",
  "sourceUnitDigest": "131235273a187bf0c86e351adc6f91ca35874ae37fefc518e2ac6cdb3d109735",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "111-claim-acquire",
  "targetUnitDigest": "131235273a187bf0c86e351adc6f91ca35874ae37fefc518e2ac6cdb3d109735",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "11. CAS And Concurrency Rules"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#111-claim-acquire (lines 656–656) is carried at docs/platform/proposals/doing-coordination-redesign.md#111-claim-acquire (lines 680–680); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 11.1 Claim Acquire

Claim acquire must be atomic over the runtime coordination store.

Acquire succeeds only if:

- the durable item exists;
- the effective item status is claimable;
- no active claim exists for the same item;
- dependencies/frontier rules allow the item for the requested flow;
- the runtime claim write wins the per-item coordination lock.

Acquire captures the durable base:

- `preClaimStatus`;
- `preClaimRevision`;
- branch/head metadata needed by merge/return policy.
```

### Full target shown text

```text
### 11.1 Claim Acquire

Claim acquire must be atomic over the runtime coordination store.

Acquire succeeds only if:

- the durable item exists;
- the effective item status is claimable;
- no active claim exists for the same item;
- dependencies/frontier rules allow the item for the requested flow;
- the runtime claim write wins the per-item coordination lock.

Acquire captures the durable base:

- `preClaimStatus`;
- `preClaimRevision`;
- branch/head metadata needed by merge/return policy.
```

## claim_cb13f4be3738dc333e8ee17873a15f69

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-106, lines 658–658.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-109.
Source digest: 1fd80c9c1401c60d52045d50825ec7c71906ade5b207afe41a3c4d6a3a26970b
Target digest: 1fd80c9c1401c60d52045d50825ec7c71906ade5b207afe41a3c4d6a3a26970b
Shown source SHA256: 1fd80c9c1401c60d52045d50825ec7c71906ade5b207afe41a3c4d6a3a26970b
Shown target SHA256: 1fd80c9c1401c60d52045d50825ec7c71906ade5b207afe41a3c4d6a3a26970b

### Proposed decision

```json
{
  "claimId": "claim_cb13f4be3738dc333e8ee17873a15f69",
  "sourceUnitDigest": "1fd80c9c1401c60d52045d50825ec7c71906ade5b207afe41a3c4d6a3a26970b",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-109",
  "targetUnitDigest": "1fd80c9c1401c60d52045d50825ec7c71906ade5b207afe41a3c4d6a3a26970b",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "11. CAS And Concurrency Rules",
    "11.1 Claim Acquire"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-106 (lines 658–658) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-109 (lines 682–682); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Claim acquire must be atomic over the runtime coordination store.
```

### Full target shown text

```text
Claim acquire must be atomic over the runtime coordination store.
```

## claim_ab21908e7e9628930d248b8118738d79

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-107, lines 660–660.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-110.
Source digest: 6548b83610738f88810fcc3981d5dedc52867c1d7abf3ba65d98645b99633fb7
Target digest: 6548b83610738f88810fcc3981d5dedc52867c1d7abf3ba65d98645b99633fb7
Shown source SHA256: 6548b83610738f88810fcc3981d5dedc52867c1d7abf3ba65d98645b99633fb7
Shown target SHA256: 6548b83610738f88810fcc3981d5dedc52867c1d7abf3ba65d98645b99633fb7

### Proposed decision

```json
{
  "claimId": "claim_ab21908e7e9628930d248b8118738d79",
  "sourceUnitDigest": "6548b83610738f88810fcc3981d5dedc52867c1d7abf3ba65d98645b99633fb7",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-110",
  "targetUnitDigest": "6548b83610738f88810fcc3981d5dedc52867c1d7abf3ba65d98645b99633fb7",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "11. CAS And Concurrency Rules",
    "11.1 Claim Acquire"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-107 (lines 660–660) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-110 (lines 684–684); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Acquire succeeds only if:
```

### Full target shown text

```text
Acquire succeeds only if:
```

## claim_7456819b616836d8bd10d119a67815d0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-108, lines 662–666.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-111.
Source digest: ba5f76b01dc62b76897868b355fb60d0ccd74a7edbf9743805976b27545fe1d6
Target digest: ba5f76b01dc62b76897868b355fb60d0ccd74a7edbf9743805976b27545fe1d6
Shown source SHA256: ba5f76b01dc62b76897868b355fb60d0ccd74a7edbf9743805976b27545fe1d6
Shown target SHA256: ba5f76b01dc62b76897868b355fb60d0ccd74a7edbf9743805976b27545fe1d6

### Proposed decision

```json
{
  "claimId": "claim_7456819b616836d8bd10d119a67815d0",
  "sourceUnitDigest": "ba5f76b01dc62b76897868b355fb60d0ccd74a7edbf9743805976b27545fe1d6",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-111",
  "targetUnitDigest": "ba5f76b01dc62b76897868b355fb60d0ccd74a7edbf9743805976b27545fe1d6",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "11. CAS And Concurrency Rules",
    "11.1 Claim Acquire"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-108 (lines 662–666) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-111 (lines 686–690); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- the durable item exists;
- the effective item status is claimable;
- no active claim exists for the same item;
- dependencies/frontier rules allow the item for the requested flow;
- the runtime claim write wins the per-item coordination lock.
```

### Full target shown text

```text
- the durable item exists;
- the effective item status is claimable;
- no active claim exists for the same item;
- dependencies/frontier rules allow the item for the requested flow;
- the runtime claim write wins the per-item coordination lock.
```

## claim_293403f28f2e80de5321144672624512

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-109, lines 668–668.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-112.
Source digest: d5d0711b32c12c87e22f4ce14ce5faf2ae44b36f205e2a065d6eb593a769b6e2
Target digest: d5d0711b32c12c87e22f4ce14ce5faf2ae44b36f205e2a065d6eb593a769b6e2
Shown source SHA256: d5d0711b32c12c87e22f4ce14ce5faf2ae44b36f205e2a065d6eb593a769b6e2
Shown target SHA256: d5d0711b32c12c87e22f4ce14ce5faf2ae44b36f205e2a065d6eb593a769b6e2

### Proposed decision

```json
{
  "claimId": "claim_293403f28f2e80de5321144672624512",
  "sourceUnitDigest": "d5d0711b32c12c87e22f4ce14ce5faf2ae44b36f205e2a065d6eb593a769b6e2",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-112",
  "targetUnitDigest": "d5d0711b32c12c87e22f4ce14ce5faf2ae44b36f205e2a065d6eb593a769b6e2",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "11. CAS And Concurrency Rules",
    "11.1 Claim Acquire"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-109 (lines 668–668) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-112 (lines 692–692); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Acquire captures the durable base:
```

### Full target shown text

```text
Acquire captures the durable base:
```

## claim_a1ea2bc895b6616553a3457a4f139cb0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-110, lines 670–672.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-113.
Source digest: 55ca029954794ea7bafe73a8b150616bf9c85ec7ccf386daccb64d7904a5fd00
Target digest: 55ca029954794ea7bafe73a8b150616bf9c85ec7ccf386daccb64d7904a5fd00
Shown source SHA256: 55ca029954794ea7bafe73a8b150616bf9c85ec7ccf386daccb64d7904a5fd00
Shown target SHA256: 55ca029954794ea7bafe73a8b150616bf9c85ec7ccf386daccb64d7904a5fd00

### Proposed decision

```json
{
  "claimId": "claim_a1ea2bc895b6616553a3457a4f139cb0",
  "sourceUnitDigest": "55ca029954794ea7bafe73a8b150616bf9c85ec7ccf386daccb64d7904a5fd00",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-113",
  "targetUnitDigest": "55ca029954794ea7bafe73a8b150616bf9c85ec7ccf386daccb64d7904a5fd00",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "11. CAS And Concurrency Rules",
    "11.1 Claim Acquire"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-110 (lines 670–672) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-113 (lines 694–696); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- `preClaimStatus`;
- `preClaimRevision`;
- branch/head metadata needed by merge/return policy.
```

### Full target shown text

```text
- `preClaimStatus`;
- `preClaimRevision`;
- branch/head metadata needed by merge/return policy.
```

## claim_04d4dd50061918305311e6a55b73cd37

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#112-settle, lines 674–674.
Target: docs/platform/proposals/doing-coordination-redesign.md#112-settle.
Source digest: 2ec8ba7bc11626907fead5e867c074ba32b4ca7d3eaed786cd53d820fa4bd07e
Target digest: 2ec8ba7bc11626907fead5e867c074ba32b4ca7d3eaed786cd53d820fa4bd07e
Shown source SHA256: 2fd8dbe4ec4ea74fb1f183069901b92550d7199ab14bc6642c7c811b69d0d5fa
Shown target SHA256: 2fd8dbe4ec4ea74fb1f183069901b92550d7199ab14bc6642c7c811b69d0d5fa

### Proposed decision

```json
{
  "claimId": "claim_04d4dd50061918305311e6a55b73cd37",
  "sourceUnitDigest": "2ec8ba7bc11626907fead5e867c074ba32b4ca7d3eaed786cd53d820fa4bd07e",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "112-settle",
  "targetUnitDigest": "2ec8ba7bc11626907fead5e867c074ba32b4ca7d3eaed786cd53d820fa4bd07e",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "11. CAS And Concurrency Rules"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#112-settle (lines 674–674) is carried at docs/platform/proposals/doing-coordination-redesign.md#112-settle (lines 698–698); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 11.2 Settle

Settle succeeds only if:

- the runtime claim exists;
- `claimId` matches;
- actor/owner is authorized;
- durable item revision still matches `preClaimRevision`, or an explicit reconcile path accepts the change;
- requested final status is valid from `preClaimStatus` according to the durable FSM;
- branch/worktree safety checks pass.

Settle must not require durable current status `doing`.
```

### Full target shown text

```text
### 11.2 Settle

Settle succeeds only if:

- the runtime claim exists;
- `claimId` matches;
- actor/owner is authorized;
- durable item revision still matches `preClaimRevision`, or an explicit reconcile path accepts the change;
- requested final status is valid from `preClaimStatus` according to the durable FSM;
- branch/worktree safety checks pass.

Settle must not require durable current status `doing`.
```

## claim_18290e1846667b82362214611c30d657

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-111, lines 676–676.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-114.
Source digest: 1c6fe1c2f125dd494c47d155f351f09c2f0da67414a7c19465849b5911fc3131
Target digest: 1c6fe1c2f125dd494c47d155f351f09c2f0da67414a7c19465849b5911fc3131
Shown source SHA256: 1c6fe1c2f125dd494c47d155f351f09c2f0da67414a7c19465849b5911fc3131
Shown target SHA256: 1c6fe1c2f125dd494c47d155f351f09c2f0da67414a7c19465849b5911fc3131

### Proposed decision

```json
{
  "claimId": "claim_18290e1846667b82362214611c30d657",
  "sourceUnitDigest": "1c6fe1c2f125dd494c47d155f351f09c2f0da67414a7c19465849b5911fc3131",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-114",
  "targetUnitDigest": "1c6fe1c2f125dd494c47d155f351f09c2f0da67414a7c19465849b5911fc3131",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "11. CAS And Concurrency Rules",
    "11.2 Settle"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-111 (lines 676–676) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-114 (lines 700–700); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Settle succeeds only if:
```

### Full target shown text

```text
Settle succeeds only if:
```

## claim_3073b08f721758ff87af12cc9e4548d6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-112, lines 678–683.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-115.
Source digest: 7b06f30e453b5276affc1b9a2cfc75f454840aafa5d39afc30ce5140dc85bee1
Target digest: 7b06f30e453b5276affc1b9a2cfc75f454840aafa5d39afc30ce5140dc85bee1
Shown source SHA256: 7b06f30e453b5276affc1b9a2cfc75f454840aafa5d39afc30ce5140dc85bee1
Shown target SHA256: 7b06f30e453b5276affc1b9a2cfc75f454840aafa5d39afc30ce5140dc85bee1

### Proposed decision

```json
{
  "claimId": "claim_3073b08f721758ff87af12cc9e4548d6",
  "sourceUnitDigest": "7b06f30e453b5276affc1b9a2cfc75f454840aafa5d39afc30ce5140dc85bee1",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-115",
  "targetUnitDigest": "7b06f30e453b5276affc1b9a2cfc75f454840aafa5d39afc30ce5140dc85bee1",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "11. CAS And Concurrency Rules",
    "11.2 Settle"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-112 (lines 678–683) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-115 (lines 702–707); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- the runtime claim exists;
- `claimId` matches;
- actor/owner is authorized;
- durable item revision still matches `preClaimRevision`, or an explicit reconcile path accepts the change;
- requested final status is valid from `preClaimStatus` according to the durable FSM;
- branch/worktree safety checks pass.
```

### Full target shown text

```text
- the runtime claim exists;
- `claimId` matches;
- actor/owner is authorized;
- durable item revision still matches `preClaimRevision`, or an explicit reconcile path accepts the change;
- requested final status is valid from `preClaimStatus` according to the durable FSM;
- branch/worktree safety checks pass.
```

## claim_7b6cb5b6d43ea5b337e19bd231903605

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-113, lines 685–685.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-116.
Source digest: d16beba0728139e291b8c4960491900acc7d83e081445af361e65761cf89cba7
Target digest: d16beba0728139e291b8c4960491900acc7d83e081445af361e65761cf89cba7
Shown source SHA256: d16beba0728139e291b8c4960491900acc7d83e081445af361e65761cf89cba7
Shown target SHA256: d16beba0728139e291b8c4960491900acc7d83e081445af361e65761cf89cba7

### Proposed decision

```json
{
  "claimId": "claim_7b6cb5b6d43ea5b337e19bd231903605",
  "sourceUnitDigest": "d16beba0728139e291b8c4960491900acc7d83e081445af361e65761cf89cba7",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-116",
  "targetUnitDigest": "d16beba0728139e291b8c4960491900acc7d83e081445af361e65761cf89cba7",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "11. CAS And Concurrency Rules",
    "11.2 Settle"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-113 (lines 685–685) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-116 (lines 709–709); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Settle must not require durable current status `doing`.
```

### Full target shown text

```text
Settle must not require durable current status `doing`.
```

## claim_f28e65c0e57407e172c800f11698022d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#113-reclaim, lines 687–687.
Target: docs/platform/proposals/doing-coordination-redesign.md#113-reclaim.
Source digest: 0d8fbc2c919c78cf874490c666ef1604e0a478132911acf51c60701f28a4f791
Target digest: 0d8fbc2c919c78cf874490c666ef1604e0a478132911acf51c60701f28a4f791
Shown source SHA256: 923b665185ca53e6ab26b46e5fb851f13adece3aa8f67d944358958af33a414d
Shown target SHA256: 923b665185ca53e6ab26b46e5fb851f13adece3aa8f67d944358958af33a414d

### Proposed decision

```json
{
  "claimId": "claim_f28e65c0e57407e172c800f11698022d",
  "sourceUnitDigest": "0d8fbc2c919c78cf874490c666ef1604e0a478132911acf51c60701f28a4f791",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "113-reclaim",
  "targetUnitDigest": "0d8fbc2c919c78cf874490c666ef1604e0a478132911acf51c60701f28a4f791",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "11. CAS And Concurrency Rules"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#113-reclaim (lines 687–687) is carried at docs/platform/proposals/doing-coordination-redesign.md#113-reclaim (lines 711–711); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 11.3 Reclaim

Reclaim must not be driven by a fixed TTL alone.

Primary reclaim basis:

- current worktree existence;
- git status activity;
- observed file/index changes;
- `lastActivityAt`;
- role-specific thresholds such as shorter agent threshold and longer human threshold.

`hardExpiresAt` may force review or reclaim only as a safety backstop.

Reclaim only applies to active runtime claims. A parked `awaiting-human` item is
not active work and must not be reclaimed as stale doing. If a claim is paused
for a human question, that paused state must be excluded from worker-slot counts
and from normal stale-doing reclaim until it is reactivated.
```

### Full target shown text

```text
### 11.3 Reclaim

Reclaim must not be driven by a fixed TTL alone.

Primary reclaim basis:

- current worktree existence;
- git status activity;
- observed file/index changes;
- `lastActivityAt`;
- role-specific thresholds such as shorter agent threshold and longer human threshold.

`hardExpiresAt` may force review or reclaim only as a safety backstop.

Reclaim only applies to active runtime claims. A parked `awaiting-human` item is
not active work and must not be reclaimed as stale doing. If a claim is paused
for a human question, that paused state must be excluded from worker-slot counts
and from normal stale-doing reclaim until it is reactivated.
```

## claim_5caf9e995817688cdb86f817bcf9babe

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-114, lines 689–689.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-117.
Source digest: 451cb95b606efd5a01ac1528864f4c808eb7537731d2b35c1dc39c1dafd69bd7
Target digest: 451cb95b606efd5a01ac1528864f4c808eb7537731d2b35c1dc39c1dafd69bd7
Shown source SHA256: 451cb95b606efd5a01ac1528864f4c808eb7537731d2b35c1dc39c1dafd69bd7
Shown target SHA256: 451cb95b606efd5a01ac1528864f4c808eb7537731d2b35c1dc39c1dafd69bd7

### Proposed decision

```json
{
  "claimId": "claim_5caf9e995817688cdb86f817bcf9babe",
  "sourceUnitDigest": "451cb95b606efd5a01ac1528864f4c808eb7537731d2b35c1dc39c1dafd69bd7",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-117",
  "targetUnitDigest": "451cb95b606efd5a01ac1528864f4c808eb7537731d2b35c1dc39c1dafd69bd7",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "11. CAS And Concurrency Rules",
    "11.3 Reclaim"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-114 (lines 689–689) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-117 (lines 713–713); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Reclaim must not be driven by a fixed TTL alone.
```

### Full target shown text

```text
Reclaim must not be driven by a fixed TTL alone.
```

## claim_9b56b7980c0133da8f60630a82bc7919

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-115, lines 691–691.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-118.
Source digest: 015ba769aab1f1f79bbc12416d503dc02c7217bcc11a28fa0727b5db87397af4
Target digest: 015ba769aab1f1f79bbc12416d503dc02c7217bcc11a28fa0727b5db87397af4
Shown source SHA256: 015ba769aab1f1f79bbc12416d503dc02c7217bcc11a28fa0727b5db87397af4
Shown target SHA256: 015ba769aab1f1f79bbc12416d503dc02c7217bcc11a28fa0727b5db87397af4

### Proposed decision

```json
{
  "claimId": "claim_9b56b7980c0133da8f60630a82bc7919",
  "sourceUnitDigest": "015ba769aab1f1f79bbc12416d503dc02c7217bcc11a28fa0727b5db87397af4",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-118",
  "targetUnitDigest": "015ba769aab1f1f79bbc12416d503dc02c7217bcc11a28fa0727b5db87397af4",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "11. CAS And Concurrency Rules",
    "11.3 Reclaim"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-115 (lines 691–691) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-118 (lines 715–715); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Primary reclaim basis:
```

### Full target shown text

```text
Primary reclaim basis:
```

## claim_a0d3da985a3628304d0ace1fac4ae9b3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-116, lines 693–697.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-119.
Source digest: 016accb124a8558c05d7cb0b4afc164713238f6a3058eb5d8bd89ff14f93f4f5
Target digest: 016accb124a8558c05d7cb0b4afc164713238f6a3058eb5d8bd89ff14f93f4f5
Shown source SHA256: 016accb124a8558c05d7cb0b4afc164713238f6a3058eb5d8bd89ff14f93f4f5
Shown target SHA256: 016accb124a8558c05d7cb0b4afc164713238f6a3058eb5d8bd89ff14f93f4f5

### Proposed decision

```json
{
  "claimId": "claim_a0d3da985a3628304d0ace1fac4ae9b3",
  "sourceUnitDigest": "016accb124a8558c05d7cb0b4afc164713238f6a3058eb5d8bd89ff14f93f4f5",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-119",
  "targetUnitDigest": "016accb124a8558c05d7cb0b4afc164713238f6a3058eb5d8bd89ff14f93f4f5",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "11. CAS And Concurrency Rules",
    "11.3 Reclaim"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-116 (lines 693–697) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-119 (lines 717–721); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
- current worktree existence;
- git status activity;
- observed file/index changes;
- `lastActivityAt`;
- role-specific thresholds such as shorter agent threshold and longer human threshold.
```

### Full target shown text

```text
- current worktree existence;
- git status activity;
- observed file/index changes;
- `lastActivityAt`;
- role-specific thresholds such as shorter agent threshold and longer human threshold.
```

## claim_1a81e5873da9788ccb5b65a1d8b4479d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-117, lines 699–699.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-120.
Source digest: 2da362b9fcc41adc16ceb58522f7913f9454c1517dcd0887c87c58b71ae4d71b
Target digest: 2da362b9fcc41adc16ceb58522f7913f9454c1517dcd0887c87c58b71ae4d71b
Shown source SHA256: 2da362b9fcc41adc16ceb58522f7913f9454c1517dcd0887c87c58b71ae4d71b
Shown target SHA256: 2da362b9fcc41adc16ceb58522f7913f9454c1517dcd0887c87c58b71ae4d71b

### Proposed decision

```json
{
  "claimId": "claim_1a81e5873da9788ccb5b65a1d8b4479d",
  "sourceUnitDigest": "2da362b9fcc41adc16ceb58522f7913f9454c1517dcd0887c87c58b71ae4d71b",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-120",
  "targetUnitDigest": "2da362b9fcc41adc16ceb58522f7913f9454c1517dcd0887c87c58b71ae4d71b",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "11. CAS And Concurrency Rules",
    "11.3 Reclaim"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-117 (lines 699–699) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-120 (lines 723–723); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
`hardExpiresAt` may force review or reclaim only as a safety backstop.
```

### Full target shown text

```text
`hardExpiresAt` may force review or reclaim only as a safety backstop.
```

## claim_39a155dbdfe2376c31691cc5a61cdbc6

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-118, lines 701–704.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-121.
Source digest: 284d2169de510c758574235ece10b18081ef63b3e3078413700f40c8fc4eb743
Target digest: 284d2169de510c758574235ece10b18081ef63b3e3078413700f40c8fc4eb743
Shown source SHA256: 284d2169de510c758574235ece10b18081ef63b3e3078413700f40c8fc4eb743
Shown target SHA256: 284d2169de510c758574235ece10b18081ef63b3e3078413700f40c8fc4eb743

### Proposed decision

```json
{
  "claimId": "claim_39a155dbdfe2376c31691cc5a61cdbc6",
  "sourceUnitDigest": "284d2169de510c758574235ece10b18081ef63b3e3078413700f40c8fc4eb743",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-121",
  "targetUnitDigest": "284d2169de510c758574235ece10b18081ef63b3e3078413700f40c8fc4eb743",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "11. CAS And Concurrency Rules",
    "11.3 Reclaim"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-118 (lines 701–704) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-121 (lines 725–728); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Reclaim only applies to active runtime claims. A parked `awaiting-human` item is
not active work and must not be reclaimed as stale doing. If a claim is paused
for a human question, that paused state must be excluded from worker-slot counts
and from normal stale-doing reclaim until it is reactivated.
```

### Full target shown text

```text
Reclaim only applies to active runtime claims. A parked `awaiting-human` item is
not active work and must not be reclaimed as stale doing. If a claim is paused
for a human question, that paused state must be excluded from worker-slot counts
and from normal stale-doing reclaim until it is reactivated.
```

## claim_7d97628c15fdef8b3434dfae02a536c2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#12-scheduling-and-query-rules, lines 706–706.
Target: docs/platform/proposals/doing-coordination-redesign.md#12-scheduling-and-query-rules.
Source digest: cb6d25f07b795750911409a932e7d5060eb24b517900720308e67f9d9588803c
Target digest: cb6d25f07b795750911409a932e7d5060eb24b517900720308e67f9d9588803c
Shown source SHA256: a8b723d7750885005f68a690891704e828f1e571fe3509743b3a0009760a2a1f
Shown target SHA256: a8b723d7750885005f68a690891704e828f1e571fe3509743b3a0009760a2a1f

### Proposed decision

```json
{
  "claimId": "claim_7d97628c15fdef8b3434dfae02a536c2",
  "sourceUnitDigest": "cb6d25f07b795750911409a932e7d5060eb24b517900720308e67f9d9588803c",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "12-scheduling-and-query-rules",
  "targetUnitDigest": "cb6d25f07b795750911409a932e7d5060eb24b517900720308e67f9d9588803c",
  "targetAncestry": [
    "Doing Coordination Redesign"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#12-scheduling-and-query-rules (lines 706–706) is carried at docs/platform/proposals/doing-coordination-redesign.md#12-scheduling-and-query-rules (lines 730–730); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
## 12. Scheduling And Query Rules
```

### Full target shown text

```text
## 12. Scheduling And Query Rules
```

## claim_e65297f32b1e4097312effe36a07b657

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/doing-coordination-redesign.md#121-frontier, lines 708–708.
Target: docs/platform/proposals/doing-coordination-redesign.md#121-frontier.
Source digest: 13078a97b0ec5071afcf98f3f5c03db042427b7ca008f49bfa6cda27ba01a738
Target digest: 13078a97b0ec5071afcf98f3f5c03db042427b7ca008f49bfa6cda27ba01a738
Shown source SHA256: bef7591183391deb9609e4d8a1532a25e29916f2a774d5c8eb04f4b60fd50776
Shown target SHA256: bef7591183391deb9609e4d8a1532a25e29916f2a774d5c8eb04f4b60fd50776

### Proposed decision

```json
{
  "claimId": "claim_e65297f32b1e4097312effe36a07b657",
  "sourceUnitDigest": "13078a97b0ec5071afcf98f3f5c03db042427b7ca008f49bfa6cda27ba01a738",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "121-frontier",
  "targetUnitDigest": "13078a97b0ec5071afcf98f3f5c03db042427b7ca008f49bfa6cda27ba01a738",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "12. Scheduling And Query Rules"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source heading docs/architect/doing-coordination-redesign.md#121-frontier (lines 708–708) is carried at docs/platform/proposals/doing-coordination-redesign.md#121-frontier (lines 732–732); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
### 12.1 Frontier

Frontier must operate on effective status.

If an item is durable `todo` but has an active claim, frontier must treat it as `doing`, open, and unavailable for another claim.

Dependency resolution should still use durable finality:

- final/delivered statuses satisfy dependencies;
- parked statuses do not satisfy dependencies unless existing policy explicitly says otherwise;
- effective `doing` is open and unresolved;
- claimable `todo` is open and available only when no active claim exists.
```

### Full target shown text

```text
### 12.1 Frontier

Frontier must operate on effective status.

If an item is durable `todo` but has an active claim, frontier must treat it as `doing`, open, and unavailable for another claim.

Dependency resolution should still use durable finality:

- final/delivered statuses satisfy dependencies;
- parked statuses do not satisfy dependencies unless existing policy explicitly says otherwise;
- effective `doing` is open and unresolved;
- claimable `todo` is open and available only when no active claim exists.
```

## claim_c160dc96638f20e0048fcb0f6a5120d0

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/doing-coordination-redesign.md#unheaded-block-119, lines 710–710.
Target: docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-122.
Source digest: dd56b95d1d6e994085d04e9df17d4771ffdd5b921110fb0cfb0a0ad30e90011d
Target digest: dd56b95d1d6e994085d04e9df17d4771ffdd5b921110fb0cfb0a0ad30e90011d
Shown source SHA256: dd56b95d1d6e994085d04e9df17d4771ffdd5b921110fb0cfb0a0ad30e90011d
Shown target SHA256: dd56b95d1d6e994085d04e9df17d4771ffdd5b921110fb0cfb0a0ad30e90011d

### Proposed decision

```json
{
  "claimId": "claim_c160dc96638f20e0048fcb0f6a5120d0",
  "sourceUnitDigest": "dd56b95d1d6e994085d04e9df17d4771ffdd5b921110fb0cfb0a0ad30e90011d",
  "targetOwner": "docs/platform/proposals/doing-coordination-redesign.md",
  "targetAnchor": "unheaded-block-122",
  "targetUnitDigest": "dd56b95d1d6e994085d04e9df17d4771ffdd5b921110fb0cfb0a0ad30e90011d",
  "targetAncestry": [
    "Doing Coordination Redesign",
    "12. Scheduling And Query Rules",
    "12.1 Frontier"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Evidence: Source lines 3–19 records tsk-40m / 401a2282ee381b5c2831e6f4d7538e834ada6503 and the dated reconcile gap. src/state/status-fsm.mjs:117, src/state/store.mjs:749,1039,1164,1342, src/state/replay.mjs:710, src/runner/claim-port.mjs:219 and merge.mjs:1409 still cite it. Complete source unheaded-block docs/architect/doing-coordination-redesign.md#unheaded-block-119 (lines 710–710) is carried at docs/platform/proposals/doing-coordination-redesign.md#unheaded-block-122 (lines 734–734); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Frontier must operate on effective status.
```

### Full target shown text

```text
Frontier must operate on effective status.
```
