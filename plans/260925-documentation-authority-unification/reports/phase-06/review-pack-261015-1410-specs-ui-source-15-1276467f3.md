# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-ui-spec-01.json
Shard SHA256: 92d9c405f3eb4795fc09b6b58504f33d1153a43505752799d0e7c463e83f9833
Source: docs/ui-spec/15-system-events.md
Part 1/1; entries: **9**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 1/1 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_1d9a2f67d538f7938f0987b2065c7e16",
      "claim_1ddab2f3852d81b387b8cf74a1311d0a",
      "claim_d6076e6b828e60d4f4461a9fa942abd0",
      "claim_de45b6ef8f78c2b53349376df8072f5d",
      "claim_96fc409e143e98260cfd0695c72fa9a0",
      "claim_c843b4d07d3d98b6ae711e0d44dee9cd",
      "claim_0dfdb4f90458e4e9005cca22add8561e",
      "claim_3840275b1b17103c2967eb18f7a7406c"
    ],
    "Weak-exact": [],
    "Judgment": [
      "claim_72d974cfc4b8fc20f10bebfb25de4930"
    ]
  },
  "unequalDigestPairs": [
    "claim_72d974cfc4b8fc20f10bebfb25de4930"
  ],
  "noTargetGeneratedRows": [],
  "mandatoryDeep": [
    "claim_72d974cfc4b8fc20f10bebfb25de4930"
  ]
}
```


Return Reviewer, Author session(s), Review mode: ordinary, immutable content/request/shard pins, and one row per claim. Use ok/rework/hold, an own note prefixed deep or mechanical, full 64-hex digests; literal none for absent target. Consolidate parts by original shard before applying.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|


## claim_1d9a2f67d538f7938f0987b2065c7e16

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/15-system-events.md#unheaded-block-1; lines 1–6; ancestry [].
Target: docs/platform/ui-spec/contracts/15-system-events.md#unheaded-block-1; ancestry [].
Source digest: e13c6b0538fcc22c0487c1bd07773dea3e9900b4add7789e144f0daf94145a66
Target digest: e13c6b0538fcc22c0487c1bd07773dea3e9900b4add7789e144f0daf94145a66
Shown source SHA256: e13c6b0538fcc22c0487c1bd07773dea3e9900b4add7789e144f0daf94145a66
Shown target SHA256: e13c6b0538fcc22c0487c1bd07773dea3e9900b4add7789e144f0daf94145a66

### Complete proposed decision

```json
{
  "claimId": "claim_1d9a2f67d538f7938f0987b2065c7e16",
  "sourceUnitDigest": "e13c6b0538fcc22c0487c1bd07773dea3e9900b4add7789e144f0daf94145a66",
  "targetOwner": "docs/platform/ui-spec/contracts/15-system-events.md",
  "targetAnchor": "unheaded-block-1",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-preamble unit docs/ui-spec/15-system-events.md#unheaded-block-1 (source lines 1-6) is carried at docs/platform/ui-spec/contracts/15-system-events.md#unheaded-block-1 (candidate lines 1-6). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/15-system-events.md verbatim in docs/platform/ui-spec/contracts/15-system-events.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "e13c6b0538fcc22c0487c1bd07773dea3e9900b4add7789e144f0daf94145a66",
  "targetAncestry": []
}
```

### Full source shown text

```text
---
id: system-events
type: cross-cutting
name: "System Events"
status: active
---
```

### Full target shown text

```text
---
id: system-events
type: cross-cutting
name: "System Events"
status: active
---
```

## claim_72d974cfc4b8fc20f10bebfb25de4930

Class: Judgment; mandatory deep: true.
Source: docs/ui-spec/15-system-events.md#system-events; lines 8–8; ancestry [].
Target: docs/platform/ui-spec/contracts/15-system-events.md#system-events; ancestry [].
Source digest: fbf9bdc1e819ef62041ff6c93fbc78696ed91e1fa23c939a373ff0c8566d349f
Target digest: ec92c276bba30aa7cee14efca6fbec7517137f00775ec64608fbfda2dd1cde0b
Shown source SHA256: 777d57f2817d350f473f8b84eedd5174fad1fe40754225d40b5ae47c962f2184
Shown target SHA256: 237e9b9289bc81fbc8ad9260e07e11371f89174542473152b8f368acd8739a4e

### Complete proposed decision

```json
{
  "claimId": "claim_72d974cfc4b8fc20f10bebfb25de4930",
  "sourceUnitDigest": "fbf9bdc1e819ef62041ff6c93fbc78696ed91e1fa23c939a373ff0c8566d349f",
  "targetOwner": "docs/platform/ui-spec/contracts/15-system-events.md",
  "targetAnchor": "system-events",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Judgment: no target digest match. The whole heading unit docs/ui-spec/15-system-events.md#system-events (source lines 8-8) is carried at docs/platform/ui-spec/contracts/15-system-events.md#system-events (candidate lines 8-8). The heading section digest changes because labelled candidate metadata is inserted after the original H1; original heading and direct source payload remain verbatim. Frozen specs-ui map and Step 8: preserve docs/ui-spec/15-system-events.md verbatim in docs/platform/ui-spec/contracts/15-system-events.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "ec92c276bba30aa7cee14efca6fbec7517137f00775ec64608fbfda2dd1cde0b",
  "targetAncestry": []
}
```

### Full source shown text

````text
# System events

Backend signals surfaces listen to. Dotted names, exempt from
VR-LISTEN-ORPHAN (they come from the gateway, not from a component).

**These are client-derived events, not server-pushed ones.** The gateway
has no SSE and no WebSocket — its only change-detection surface is a cheap
poll of `GET /v1/state/digest`, which returns a `data_hash`
(`docs/contracts/fgos-gateway-api-v1.yaml`; 17 routes, none of them a
stream). The client polls that digest, and when the hash differs from the
one it last saw, it re-reads whatever the open screen needs and raises the
events below itself. Nothing in the gateway emits them.

That distinction is load-bearing for anyone implementing a screen: there is
no subscription to open, no connection to keep alive, and no ordering
guarantee between events — only "the hash changed, so something did." An
event here names *what the client concluded changed*, not a message that
arrived.

R11 still pins that nothing on this surface alerts a person, so these
events only keep an already-open screen current. A person who is not
looking learns nothing — and with polling that is doubly true, since a
screen that is closed is not polling at all.

| Event | Meaning | Listened to by |
|---|---|---|
| `work.changed` | One work item's status/stage changed | S02, S03 |
| `question.opened` | An item parked and now needs a person | S02, S04 |
| `question.answered` | A parked item resumed | S03, S04 |
| `merge.settled` | An approve-merge finished (delivered or blocked) | S03 |
| `gateway.unreachable` | The digest poll itself failed | S02, S03, S04 |

`gateway.unreachable` is the one event every data-bearing screen must
handle, because the area spec's Edge Cases pin the behaviour: say so
plainly, offer retry, and never present stale data as current. Under
polling it is also the most common of the five, since every poll is a fresh
chance for the gateway to be unreachable.

```yaml herdrweb-contract
system: gateway
```
````

### Full target shown text

````text
# System events

```txt
Document type: Contract
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve mapped legacy content for independent conservation review
Design status: Candidate
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/ui-spec/15-system-events.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing carriage, placement and source conservation
Do not use this for: Current canonical authority or implemented-behavior proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/ui-spec/15-system-events.md
Supersedes: None; candidate only
Superseded by: None
```

> Added in candidate: Candidate metadata and placement scaffolding.  Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions.


Backend signals surfaces listen to. Dotted names, exempt from
VR-LISTEN-ORPHAN (they come from the gateway, not from a component).

**These are client-derived events, not server-pushed ones.** The gateway
has no SSE and no WebSocket — its only change-detection surface is a cheap
poll of `GET /v1/state/digest`, which returns a `data_hash`
(`docs/contracts/fgos-gateway-api-v1.yaml`; 17 routes, none of them a
stream). The client polls that digest, and when the hash differs from the
one it last saw, it re-reads whatever the open screen needs and raises the
events below itself. Nothing in the gateway emits them.

That distinction is load-bearing for anyone implementing a screen: there is
no subscription to open, no connection to keep alive, and no ordering
guarantee between events — only "the hash changed, so something did." An
event here names *what the client concluded changed*, not a message that
arrived.

R11 still pins that nothing on this surface alerts a person, so these
events only keep an already-open screen current. A person who is not
looking learns nothing — and with polling that is doubly true, since a
screen that is closed is not polling at all.

| Event | Meaning | Listened to by |
|---|---|---|
| `work.changed` | One work item's status/stage changed | S02, S03 |
| `question.opened` | An item parked and now needs a person | S02, S04 |
| `question.answered` | A parked item resumed | S03, S04 |
| `merge.settled` | An approve-merge finished (delivered or blocked) | S03 |
| `gateway.unreachable` | The digest poll itself failed | S02, S03, S04 |

`gateway.unreachable` is the one event every data-bearing screen must
handle, because the area spec's Edge Cases pin the behaviour: say so
plainly, offer retry, and never present stale data as current. Under
polling it is also the most common of the five, since every poll is a fresh
chance for the gateway to be unreachable.

```yaml herdrweb-contract
system: gateway
```
````

## claim_1ddab2f3852d81b387b8cf74a1311d0a

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/15-system-events.md#unheaded-block-2; lines 10–11; ancestry ["System events"].
Target: docs/platform/ui-spec/contracts/15-system-events.md#unheaded-block-4; ancestry ["System events"].
Source digest: 913f124f9b88bca2eb8e1d9d8350df0bb8b5637505ec127a5dad11a33e763f1a
Target digest: 913f124f9b88bca2eb8e1d9d8350df0bb8b5637505ec127a5dad11a33e763f1a
Shown source SHA256: 913f124f9b88bca2eb8e1d9d8350df0bb8b5637505ec127a5dad11a33e763f1a
Shown target SHA256: 913f124f9b88bca2eb8e1d9d8350df0bb8b5637505ec127a5dad11a33e763f1a

### Complete proposed decision

```json
{
  "claimId": "claim_1ddab2f3852d81b387b8cf74a1311d0a",
  "sourceUnitDigest": "913f124f9b88bca2eb8e1d9d8350df0bb8b5637505ec127a5dad11a33e763f1a",
  "targetOwner": "docs/platform/ui-spec/contracts/15-system-events.md",
  "targetAnchor": "unheaded-block-4",
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/15-system-events.md#unheaded-block-2 (source lines 10-11) is carried at docs/platform/ui-spec/contracts/15-system-events.md#unheaded-block-4 (candidate lines 32-33). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/15-system-events.md verbatim in docs/platform/ui-spec/contracts/15-system-events.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "913f124f9b88bca2eb8e1d9d8350df0bb8b5637505ec127a5dad11a33e763f1a",
  "targetAncestry": [
    "System events"
  ]
}
```

### Full source shown text

```text
Backend signals surfaces listen to. Dotted names, exempt from
VR-LISTEN-ORPHAN (they come from the gateway, not from a component).
```

### Full target shown text

```text
Backend signals surfaces listen to. Dotted names, exempt from
VR-LISTEN-ORPHAN (they come from the gateway, not from a component).
```

## claim_d6076e6b828e60d4f4461a9fa942abd0

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/15-system-events.md#unheaded-block-3; lines 13–19; ancestry ["System events"].
Target: docs/platform/ui-spec/contracts/15-system-events.md#unheaded-block-5; ancestry ["System events"].
Source digest: c75c05d93e077f415da151b39988a18e3fea9d74828310aad3e6b05e41d45220
Target digest: c75c05d93e077f415da151b39988a18e3fea9d74828310aad3e6b05e41d45220
Shown source SHA256: c75c05d93e077f415da151b39988a18e3fea9d74828310aad3e6b05e41d45220
Shown target SHA256: c75c05d93e077f415da151b39988a18e3fea9d74828310aad3e6b05e41d45220

### Complete proposed decision

```json
{
  "claimId": "claim_d6076e6b828e60d4f4461a9fa942abd0",
  "sourceUnitDigest": "c75c05d93e077f415da151b39988a18e3fea9d74828310aad3e6b05e41d45220",
  "targetOwner": "docs/platform/ui-spec/contracts/15-system-events.md",
  "targetAnchor": "unheaded-block-5",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/15-system-events.md#unheaded-block-3 (source lines 13-19) is carried at docs/platform/ui-spec/contracts/15-system-events.md#unheaded-block-5 (candidate lines 35-41). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/15-system-events.md verbatim in docs/platform/ui-spec/contracts/15-system-events.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "c75c05d93e077f415da151b39988a18e3fea9d74828310aad3e6b05e41d45220",
  "targetAncestry": [
    "System events"
  ]
}
```

### Full source shown text

```text
**These are client-derived events, not server-pushed ones.** The gateway
has no SSE and no WebSocket — its only change-detection surface is a cheap
poll of `GET /v1/state/digest`, which returns a `data_hash`
(`docs/contracts/fgos-gateway-api-v1.yaml`; 17 routes, none of them a
stream). The client polls that digest, and when the hash differs from the
one it last saw, it re-reads whatever the open screen needs and raises the
events below itself. Nothing in the gateway emits them.
```

### Full target shown text

```text
**These are client-derived events, not server-pushed ones.** The gateway
has no SSE and no WebSocket — its only change-detection surface is a cheap
poll of `GET /v1/state/digest`, which returns a `data_hash`
(`docs/contracts/fgos-gateway-api-v1.yaml`; 17 routes, none of them a
stream). The client polls that digest, and when the hash differs from the
one it last saw, it re-reads whatever the open screen needs and raises the
events below itself. Nothing in the gateway emits them.
```

## claim_de45b6ef8f78c2b53349376df8072f5d

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/15-system-events.md#unheaded-block-4; lines 21–25; ancestry ["System events"].
Target: docs/platform/ui-spec/contracts/15-system-events.md#unheaded-block-6; ancestry ["System events"].
Source digest: 3230d51afd86168ac0d6b0b941bdbec980f1c93342cfbf90d889d99a79c37b7c
Target digest: 3230d51afd86168ac0d6b0b941bdbec980f1c93342cfbf90d889d99a79c37b7c
Shown source SHA256: 3230d51afd86168ac0d6b0b941bdbec980f1c93342cfbf90d889d99a79c37b7c
Shown target SHA256: 3230d51afd86168ac0d6b0b941bdbec980f1c93342cfbf90d889d99a79c37b7c

### Complete proposed decision

```json
{
  "claimId": "claim_de45b6ef8f78c2b53349376df8072f5d",
  "sourceUnitDigest": "3230d51afd86168ac0d6b0b941bdbec980f1c93342cfbf90d889d99a79c37b7c",
  "targetOwner": "docs/platform/ui-spec/contracts/15-system-events.md",
  "targetAnchor": "unheaded-block-6",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/15-system-events.md#unheaded-block-4 (source lines 21-25) is carried at docs/platform/ui-spec/contracts/15-system-events.md#unheaded-block-6 (candidate lines 43-47). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/15-system-events.md verbatim in docs/platform/ui-spec/contracts/15-system-events.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "3230d51afd86168ac0d6b0b941bdbec980f1c93342cfbf90d889d99a79c37b7c",
  "targetAncestry": [
    "System events"
  ]
}
```

### Full source shown text

```text
That distinction is load-bearing for anyone implementing a screen: there is
no subscription to open, no connection to keep alive, and no ordering
guarantee between events — only "the hash changed, so something did." An
event here names *what the client concluded changed*, not a message that
arrived.
```

### Full target shown text

```text
That distinction is load-bearing for anyone implementing a screen: there is
no subscription to open, no connection to keep alive, and no ordering
guarantee between events — only "the hash changed, so something did." An
event here names *what the client concluded changed*, not a message that
arrived.
```

## claim_96fc409e143e98260cfd0695c72fa9a0

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/15-system-events.md#unheaded-block-5; lines 27–30; ancestry ["System events"].
Target: docs/platform/ui-spec/contracts/15-system-events.md#unheaded-block-7; ancestry ["System events"].
Source digest: c3d3ec45edcf27bd90678fd6c343e01f42f3b3e9d46dea269689f945734d04b7
Target digest: c3d3ec45edcf27bd90678fd6c343e01f42f3b3e9d46dea269689f945734d04b7
Shown source SHA256: c3d3ec45edcf27bd90678fd6c343e01f42f3b3e9d46dea269689f945734d04b7
Shown target SHA256: c3d3ec45edcf27bd90678fd6c343e01f42f3b3e9d46dea269689f945734d04b7

### Complete proposed decision

```json
{
  "claimId": "claim_96fc409e143e98260cfd0695c72fa9a0",
  "sourceUnitDigest": "c3d3ec45edcf27bd90678fd6c343e01f42f3b3e9d46dea269689f945734d04b7",
  "targetOwner": "docs/platform/ui-spec/contracts/15-system-events.md",
  "targetAnchor": "unheaded-block-7",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/15-system-events.md#unheaded-block-5 (source lines 27-30) is carried at docs/platform/ui-spec/contracts/15-system-events.md#unheaded-block-7 (candidate lines 49-52). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/15-system-events.md verbatim in docs/platform/ui-spec/contracts/15-system-events.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "c3d3ec45edcf27bd90678fd6c343e01f42f3b3e9d46dea269689f945734d04b7",
  "targetAncestry": [
    "System events"
  ]
}
```

### Full source shown text

```text
R11 still pins that nothing on this surface alerts a person, so these
events only keep an already-open screen current. A person who is not
looking learns nothing — and with polling that is doubly true, since a
screen that is closed is not polling at all.
```

### Full target shown text

```text
R11 still pins that nothing on this surface alerts a person, so these
events only keep an already-open screen current. A person who is not
looking learns nothing — and with polling that is doubly true, since a
screen that is closed is not polling at all.
```

## claim_c843b4d07d3d98b6ae711e0d44dee9cd

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/15-system-events.md#unheaded-block-6; lines 32–38; ancestry ["System events"].
Target: docs/platform/ui-spec/contracts/15-system-events.md#unheaded-block-8; ancestry ["System events"].
Source digest: 4bbbe0a7e63ef0ba2347a43f05399168b927a3be951963e858498793bbdc293d
Target digest: 4bbbe0a7e63ef0ba2347a43f05399168b927a3be951963e858498793bbdc293d
Shown source SHA256: 4bbbe0a7e63ef0ba2347a43f05399168b927a3be951963e858498793bbdc293d
Shown target SHA256: 4bbbe0a7e63ef0ba2347a43f05399168b927a3be951963e858498793bbdc293d

### Complete proposed decision

```json
{
  "claimId": "claim_c843b4d07d3d98b6ae711e0d44dee9cd",
  "sourceUnitDigest": "4bbbe0a7e63ef0ba2347a43f05399168b927a3be951963e858498793bbdc293d",
  "targetOwner": "docs/platform/ui-spec/contracts/15-system-events.md",
  "targetAnchor": "unheaded-block-8",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/15-system-events.md#unheaded-block-6 (source lines 32-38) is carried at docs/platform/ui-spec/contracts/15-system-events.md#unheaded-block-8 (candidate lines 54-60). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/15-system-events.md verbatim in docs/platform/ui-spec/contracts/15-system-events.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "4bbbe0a7e63ef0ba2347a43f05399168b927a3be951963e858498793bbdc293d",
  "targetAncestry": [
    "System events"
  ]
}
```

### Full source shown text

```text
| Event | Meaning | Listened to by |
|---|---|---|
| `work.changed` | One work item's status/stage changed | S02, S03 |
| `question.opened` | An item parked and now needs a person | S02, S04 |
| `question.answered` | A parked item resumed | S03, S04 |
| `merge.settled` | An approve-merge finished (delivered or blocked) | S03 |
| `gateway.unreachable` | The digest poll itself failed | S02, S03, S04 |
```

### Full target shown text

```text
| Event | Meaning | Listened to by |
|---|---|---|
| `work.changed` | One work item's status/stage changed | S02, S03 |
| `question.opened` | An item parked and now needs a person | S02, S04 |
| `question.answered` | A parked item resumed | S03, S04 |
| `merge.settled` | An approve-merge finished (delivered or blocked) | S03 |
| `gateway.unreachable` | The digest poll itself failed | S02, S03, S04 |
```

## claim_0dfdb4f90458e4e9005cca22add8561e

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/15-system-events.md#unheaded-block-7; lines 40–44; ancestry ["System events"].
Target: docs/platform/ui-spec/contracts/15-system-events.md#unheaded-block-9; ancestry ["System events"].
Source digest: 4446f3202dc7b42c7772d91df31d7824e97d8b9cf83a0c7d621cdec61be731c5
Target digest: 4446f3202dc7b42c7772d91df31d7824e97d8b9cf83a0c7d621cdec61be731c5
Shown source SHA256: 4446f3202dc7b42c7772d91df31d7824e97d8b9cf83a0c7d621cdec61be731c5
Shown target SHA256: 4446f3202dc7b42c7772d91df31d7824e97d8b9cf83a0c7d621cdec61be731c5

### Complete proposed decision

```json
{
  "claimId": "claim_0dfdb4f90458e4e9005cca22add8561e",
  "sourceUnitDigest": "4446f3202dc7b42c7772d91df31d7824e97d8b9cf83a0c7d621cdec61be731c5",
  "targetOwner": "docs/platform/ui-spec/contracts/15-system-events.md",
  "targetAnchor": "unheaded-block-9",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/15-system-events.md#unheaded-block-7 (source lines 40-44) is carried at docs/platform/ui-spec/contracts/15-system-events.md#unheaded-block-9 (candidate lines 62-66). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/15-system-events.md verbatim in docs/platform/ui-spec/contracts/15-system-events.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "4446f3202dc7b42c7772d91df31d7824e97d8b9cf83a0c7d621cdec61be731c5",
  "targetAncestry": [
    "System events"
  ]
}
```

### Full source shown text

```text
`gateway.unreachable` is the one event every data-bearing screen must
handle, because the area spec's Edge Cases pin the behaviour: say so
plainly, offer retry, and never present stale data as current. Under
polling it is also the most common of the five, since every poll is a fresh
chance for the gateway to be unreachable.
```

### Full target shown text

```text
`gateway.unreachable` is the one event every data-bearing screen must
handle, because the area spec's Edge Cases pin the behaviour: say so
plainly, offer retry, and never present stale data as current. Under
polling it is also the most common of the five, since every poll is a fresh
chance for the gateway to be unreachable.
```

## claim_3840275b1b17103c2967eb18f7a7406c

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/15-system-events.md#unheaded-block-8; lines 46–48; ancestry ["System events"].
Target: docs/platform/ui-spec/contracts/15-system-events.md#unheaded-block-10; ancestry ["System events"].
Source digest: 0254be7d0a2b2b74189749eac67e1264bef26cf1740265399789dc61ef6d4b45
Target digest: 0254be7d0a2b2b74189749eac67e1264bef26cf1740265399789dc61ef6d4b45
Shown source SHA256: 0254be7d0a2b2b74189749eac67e1264bef26cf1740265399789dc61ef6d4b45
Shown target SHA256: 0254be7d0a2b2b74189749eac67e1264bef26cf1740265399789dc61ef6d4b45

### Complete proposed decision

```json
{
  "claimId": "claim_3840275b1b17103c2967eb18f7a7406c",
  "sourceUnitDigest": "0254be7d0a2b2b74189749eac67e1264bef26cf1740265399789dc61ef6d4b45",
  "targetOwner": "docs/platform/ui-spec/contracts/15-system-events.md",
  "targetAnchor": "unheaded-block-10",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/ui-spec/15-system-events.md#unheaded-block-8 (source lines 46-48) is carried at docs/platform/ui-spec/contracts/15-system-events.md#unheaded-block-10 (candidate lines 68-70). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/15-system-events.md verbatim in docs/platform/ui-spec/contracts/15-system-events.md. Map kind contract is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "0254be7d0a2b2b74189749eac67e1264bef26cf1740265399789dc61ef6d4b45",
  "targetAncestry": [
    "System events"
  ]
}
```

### Full source shown text

````text
```yaml herdrweb-contract
system: gateway
```
````

### Full target shown text

````text
```yaml herdrweb-contract
system: gateway
```
````
