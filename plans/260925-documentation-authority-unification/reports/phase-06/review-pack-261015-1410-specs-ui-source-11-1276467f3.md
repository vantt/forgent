# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-herdr-web-dashboard-01.json
Shard SHA256: 754c1e315b8b924b70e4d1d25e8be74e8c70574e9e398dc069d2e6d64746d141
Source: docs/specs/herdr-web-dashboard.md
Part 1/2; entries: **35**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 10/16 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_a6e14d898be041f4bc809648957380c1",
      "claim_48a409dd2114987646733cb3d66bd6b1",
      "claim_e9ca88e52937c9e6a7b45683453caf86",
      "claim_ba9a64fb389def2b21fce816844701ee",
      "claim_ec3a7b2ec42c939b9ac745b6bdbcf5c3",
      "claim_5877600a52b4cf5568796da3c9044b65",
      "claim_cdbe500eb5f501430eed0011898c2437",
      "claim_7d20f3261994b06bf8aab4ce53375a6b",
      "claim_8fc8f5d9d754055cd3192f32178f0ef8",
      "claim_713e8533374a977b44c019d9296ff88f",
      "claim_0af7828129bb0ef344d1aff694b04b63",
      "claim_9d613c56217c5da75868821a335fafbc",
      "claim_9d7b246d0d09f47c6fe718ca58c8d36b",
      "claim_027ad55814e7186aae754658b36a3da4",
      "claim_8103c8b9283356118e1c5f0126d387da",
      "claim_1b33df3ee3004adf514f1532e32002cc",
      "claim_ea002bc3d8c38abf1f348cce4f96931e",
      "claim_7b00d9d035bd97de226726944f711311",
      "claim_1522a44e0505b7aaed5d55bf4f2b1900"
    ],
    "Weak-exact": [
      "claim_5dfe81b1cbec092126e1eaaed02da73f",
      "claim_316763f2e8c486f23767f5235763a700",
      "claim_111f864d78a1bcae3e3c3c6b343a9ea5",
      "claim_401864f1cbebeef845e6609d3b039738",
      "claim_041b58ea676c91fd6d94a0b4772202f2",
      "claim_c05db90b99b33fe90126ccbbfedb2dd6",
      "claim_112ba0e0b60b13aa2b6cef0cc605851e",
      "claim_2f001429d74fb896c6cbefc04c4a6936",
      "claim_e4816bd194fd7cd72cde750ee0542bc3",
      "claim_62afe657fd22865fb6384797ba8b2803",
      "claim_4058c2cbc13660c9131a073491489bcf",
      "claim_663e6a3f4590e633d46c480b812428d6",
      "claim_4d256574d9d600433a7494bfed0048cb",
      "claim_55d0bc07e0c1c36016fcff043a0c492e",
      "claim_f41d47fdbe1875d4e57de8d2ecc6dcf7"
    ],
    "Judgment": [
      "claim_c947f71f7866d04b60b65ac874dd05a1"
    ]
  },
  "unequalDigestPairs": [
    "claim_c947f71f7866d04b60b65ac874dd05a1"
  ],
  "noTargetGeneratedRows": [],
  "mandatoryDeep": [
    "claim_c947f71f7866d04b60b65ac874dd05a1"
  ]
}
```


Return Reviewer, Author session(s), Review mode: ordinary, immutable content/request/shard pins, and one row per claim. Use ok/rework/hold, an own note prefixed deep or mechanical, full 64-hex digests; literal none for absent target. Consolidate parts by original shard before applying.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|


## claim_a6e14d898be041f4bc809648957380c1

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#unheaded-block-1; lines 1–7; ancestry [].
Target: docs/platform/herdr-web-dashboard/spec.md#unheaded-block-1; ancestry [].
Source digest: dea3185efa03fa43112df841e918ccc6c17fc3768e2b6617f6d9c2ebbefefda5
Target digest: dea3185efa03fa43112df841e918ccc6c17fc3768e2b6617f6d9c2ebbefefda5
Shown source SHA256: dea3185efa03fa43112df841e918ccc6c17fc3768e2b6617f6d9c2ebbefefda5
Shown target SHA256: dea3185efa03fa43112df841e918ccc6c17fc3768e2b6617f6d9c2ebbefefda5

### Complete proposed decision

```json
{
  "claimId": "claim_a6e14d898be041f4bc809648957380c1",
  "sourceUnitDigest": "dea3185efa03fa43112df841e918ccc6c17fc3768e2b6617f6d9c2ebbefefda5",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "unheaded-block-1",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-preamble unit docs/specs/herdr-web-dashboard.md#unheaded-block-1 (source lines 1-7) is carried at docs/platform/herdr-web-dashboard/spec.md#unheaded-block-1 (candidate lines 1-7). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "dea3185efa03fa43112df841e918ccc6c17fc3768e2b6617f6d9c2ebbefefda5",
  "targetAncestry": []
}
```

### Full source shown text

```text
---
area: herdr-web-dashboard
updated: 2026-10-04
sources: [herdr-web-dashboard, fgos-interface-daemon]
decisions: []
coverage: partial
---
```

### Full target shown text

```text
---
area: herdr-web-dashboard
updated: 2026-10-04
sources: [herdr-web-dashboard, fgos-interface-daemon]
decisions: []
coverage: partial
---
```

## claim_c947f71f7866d04b60b65ac874dd05a1

Class: Judgment; mandatory deep: true.
Source: docs/specs/herdr-web-dashboard.md#spec-herdr-web-dashboard-browser-surface-for-fgos-work; lines 9–9; ancestry [].
Target: docs/platform/herdr-web-dashboard/spec.md#spec-herdr-web-dashboard-browser-surface-for-fgos-work; ancestry [].
Source digest: ad9a8ac93e74932ab54505e8ac0e2cbed0051d3f82af5e6debdcb710c804876d
Target digest: fc4b99a650816005c9c724dfcb6964cccd401a8bfa963fd29af1d9eb669e4722
Shown source SHA256: 01587ff18004c621cdae0f3e2fffe62f5733e7988427871e8441222db15751f3
Shown target SHA256: 9db5f907e172566bf083e0688830a7d6cdbee436f401e2b2f64ec6e69cc6309d

### Complete proposed decision

```json
{
  "claimId": "claim_c947f71f7866d04b60b65ac874dd05a1",
  "sourceUnitDigest": "ad9a8ac93e74932ab54505e8ac0e2cbed0051d3f82af5e6debdcb710c804876d",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "spec-herdr-web-dashboard-browser-surface-for-fgos-work",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Judgment: no target digest match. The whole heading unit docs/specs/herdr-web-dashboard.md#spec-herdr-web-dashboard-browser-surface-for-fgos-work (source lines 9-9) is carried at docs/platform/herdr-web-dashboard/spec.md#spec-herdr-web-dashboard-browser-surface-for-fgos-work (candidate lines 9-9). The heading section digest changes because labelled candidate metadata is inserted after the original H1; original heading and direct source payload remain verbatim. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "fc4b99a650816005c9c724dfcb6964cccd401a8bfa963fd29af1d9eb669e4722",
  "targetAncestry": []
}
```

### Full source shown text

```text
# Spec: herdr Web Dashboard (browser surface for fgOS work)
```

### Full target shown text

````text
# Spec: herdr Web Dashboard (browser surface for fgOS work)

```txt
Document type: Specification
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve mapped legacy content for independent conservation review
Design status: Candidate
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/specs/herdr-web-dashboard.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing carriage, placement and source conservation
Do not use this for: Current canonical authority or implemented-behavior proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/specs/herdr-web-dashboard.md
Supersedes: None; candidate only
Superseded by: None
```

> Added in candidate: Candidate metadata and placement scaffolding.  Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions.
````

## claim_5dfe81b1cbec092126e1eaaed02da73f

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#purpose; lines 11–11; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)"].
Target: docs/platform/herdr-web-dashboard/spec.md#purpose; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)"].
Source digest: f1ff4f235336b1e131ee0185c562288043d9f1dc54231d3bf84360406893d587
Target digest: f1ff4f235336b1e131ee0185c562288043d9f1dc54231d3bf84360406893d587
Shown source SHA256: 4a8eb41655c02374d3e474a7d1b1234c9e78cda6866a1361a85aa94327f3f3db
Shown target SHA256: 4a8eb41655c02374d3e474a7d1b1234c9e78cda6866a1361a85aa94327f3f3db

### Complete proposed decision

```json
{
  "claimId": "claim_5dfe81b1cbec092126e1eaaed02da73f",
  "sourceUnitDigest": "f1ff4f235336b1e131ee0185c562288043d9f1dc54231d3bf84360406893d587",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "purpose",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/herdr-web-dashboard.md#purpose (source lines 11-11) is carried at docs/platform/herdr-web-dashboard/spec.md#purpose (candidate lines 33-33). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "f1ff4f235336b1e131ee0185c562288043d9f1dc54231d3bf84360406893d587",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)"
  ]
}
```

### Full source shown text

```text
## Purpose

The web dashboard is a browser surface for watching fgOS work and answering
the questions it raises, from a device that is not the developer's machine.

The need it exists for is concrete, and it is the reason the design looks the
way it does: the product owner wants to **review and approve from a phone**,
and at exactly that moment there is usually no cockpit terminal open
(rationale: `docs/history/herdr-web-dashboard/CONTEXT.md`'s own rationale section for the child-process decision — the dashboard runs as a child process that outlives the cockpit pane, precisely so it does not vanish when the terminal closes). A surface that
only lives as long as a terminal pane is absent precisely when it is needed.

Three things bound this surface:

- It runs **alongside** the herdr TUI, never replacing it (boundary: the web dashboard belongs to the fgos gateway, `apps/fgos-gateway/`; it runs alongside, not instead of, the `herdr-dashboard` TUI plugin). A
  person at a terminal keeps the TUI; the dashboard serves the person who is
  not at one.
- It is an **independent client project**, not server code inside the gateway
  (per fgos-interface-daemon — gateway and TUI sit behind hexagonal ports; the web client is a separate adapter calling in from outside). Its source lives at `apps/fgos-gateway/web/`; the fgos gateway embeds the built bundle and serves it, which is hosting, not ownership of any API logic. It calls the gateway's REST/RPC API from the outside,
  which is what decision `0014` requires of any non-terminal UI. An earlier
  decision of this feature (tsk-ldb's own — web dashboard as a new subsystem inside the former single herdr crate) proposed embedding an HTTP server
  directly in the former combined gateway-and-TUI binary (since split into `fgos-gateway` and `herdr-dashboard`); that branch is closed — cite fgos-interface-daemon's hexagonal-ports decision, not
  tsk-ldb's original one, for where the web client lives.
- It never becomes a second write path. Every change it makes goes through
  an fgOS one-door-write verb executed by the gateway (R2 below).

**Out of scope for this spec.** Question authoring quality at the source
(`tsk-539`, deliberately decoupled — tsk-ldb and tsk-539 stay scope-separated). Multi-project port/identity
mechanics (`tsk-3b0` — multi-project port/identity handling is deferred to tsk-3b0). The concrete visual layout, colour and
typography (`tsk-3x6`, `docs/reference/herdr-web-dashboard-layout.md`) — this
spec states what an actor expects to be able to do, never how it is drawn.
```

### Full target shown text

```text
## Purpose

The web dashboard is a browser surface for watching fgOS work and answering
the questions it raises, from a device that is not the developer's machine.

The need it exists for is concrete, and it is the reason the design looks the
way it does: the product owner wants to **review and approve from a phone**,
and at exactly that moment there is usually no cockpit terminal open
(rationale: `docs/history/herdr-web-dashboard/CONTEXT.md`'s own rationale section for the child-process decision — the dashboard runs as a child process that outlives the cockpit pane, precisely so it does not vanish when the terminal closes). A surface that
only lives as long as a terminal pane is absent precisely when it is needed.

Three things bound this surface:

- It runs **alongside** the herdr TUI, never replacing it (boundary: the web dashboard belongs to the fgos gateway, `apps/fgos-gateway/`; it runs alongside, not instead of, the `herdr-dashboard` TUI plugin). A
  person at a terminal keeps the TUI; the dashboard serves the person who is
  not at one.
- It is an **independent client project**, not server code inside the gateway
  (per fgos-interface-daemon — gateway and TUI sit behind hexagonal ports; the web client is a separate adapter calling in from outside). Its source lives at `apps/fgos-gateway/web/`; the fgos gateway embeds the built bundle and serves it, which is hosting, not ownership of any API logic. It calls the gateway's REST/RPC API from the outside,
  which is what decision `0014` requires of any non-terminal UI. An earlier
  decision of this feature (tsk-ldb's own — web dashboard as a new subsystem inside the former single herdr crate) proposed embedding an HTTP server
  directly in the former combined gateway-and-TUI binary (since split into `fgos-gateway` and `herdr-dashboard`); that branch is closed — cite fgos-interface-daemon's hexagonal-ports decision, not
  tsk-ldb's original one, for where the web client lives.
- It never becomes a second write path. Every change it makes goes through
  an fgOS one-door-write verb executed by the gateway (R2 below).

**Out of scope for this spec.** Question authoring quality at the source
(`tsk-539`, deliberately decoupled — tsk-ldb and tsk-539 stay scope-separated). Multi-project port/identity
mechanics (`tsk-3b0` — multi-project port/identity handling is deferred to tsk-3b0). The concrete visual layout, colour and
typography (`tsk-3x6`, `docs/reference/herdr-web-dashboard-layout.md`) — this
spec states what an actor expects to be able to do, never how it is drawn.
```

## claim_48a409dd2114987646733cb3d66bd6b1

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#unheaded-block-2; lines 13–14; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Purpose"].
Target: docs/platform/herdr-web-dashboard/spec.md#unheaded-block-4; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Purpose"].
Source digest: f5637b304adfb2017df338ea99078d779a43a721765c812868be7dce2b0b55d3
Target digest: f5637b304adfb2017df338ea99078d779a43a721765c812868be7dce2b0b55d3
Shown source SHA256: f5637b304adfb2017df338ea99078d779a43a721765c812868be7dce2b0b55d3
Shown target SHA256: f5637b304adfb2017df338ea99078d779a43a721765c812868be7dce2b0b55d3

### Complete proposed decision

```json
{
  "claimId": "claim_48a409dd2114987646733cb3d66bd6b1",
  "sourceUnitDigest": "f5637b304adfb2017df338ea99078d779a43a721765c812868be7dce2b0b55d3",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "unheaded-block-4",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/herdr-web-dashboard.md#unheaded-block-2 (source lines 13-14) is carried at docs/platform/herdr-web-dashboard/spec.md#unheaded-block-4 (candidate lines 35-36). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "f5637b304adfb2017df338ea99078d779a43a721765c812868be7dce2b0b55d3",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Purpose"
  ]
}
```

### Full source shown text

```text
The web dashboard is a browser surface for watching fgOS work and answering
the questions it raises, from a device that is not the developer's machine.
```

### Full target shown text

```text
The web dashboard is a browser surface for watching fgOS work and answering
the questions it raises, from a device that is not the developer's machine.
```

## claim_e9ca88e52937c9e6a7b45683453caf86

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#unheaded-block-3; lines 16–20; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Purpose"].
Target: docs/platform/herdr-web-dashboard/spec.md#unheaded-block-5; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Purpose"].
Source digest: 9cb9250c3b4a59113aabd2ea750c259a8d9dd93ec8c844738c9759af740673af
Target digest: 9cb9250c3b4a59113aabd2ea750c259a8d9dd93ec8c844738c9759af740673af
Shown source SHA256: 9cb9250c3b4a59113aabd2ea750c259a8d9dd93ec8c844738c9759af740673af
Shown target SHA256: 9cb9250c3b4a59113aabd2ea750c259a8d9dd93ec8c844738c9759af740673af

### Complete proposed decision

```json
{
  "claimId": "claim_e9ca88e52937c9e6a7b45683453caf86",
  "sourceUnitDigest": "9cb9250c3b4a59113aabd2ea750c259a8d9dd93ec8c844738c9759af740673af",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "unheaded-block-5",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/herdr-web-dashboard.md#unheaded-block-3 (source lines 16-20) is carried at docs/platform/herdr-web-dashboard/spec.md#unheaded-block-5 (candidate lines 38-42). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "9cb9250c3b4a59113aabd2ea750c259a8d9dd93ec8c844738c9759af740673af",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Purpose"
  ]
}
```

### Full source shown text

```text
The need it exists for is concrete, and it is the reason the design looks the
way it does: the product owner wants to **review and approve from a phone**,
and at exactly that moment there is usually no cockpit terminal open
(rationale: `docs/history/herdr-web-dashboard/CONTEXT.md`'s own rationale section for the child-process decision — the dashboard runs as a child process that outlives the cockpit pane, precisely so it does not vanish when the terminal closes). A surface that
only lives as long as a terminal pane is absent precisely when it is needed.
```

### Full target shown text

```text
The need it exists for is concrete, and it is the reason the design looks the
way it does: the product owner wants to **review and approve from a phone**,
and at exactly that moment there is usually no cockpit terminal open
(rationale: `docs/history/herdr-web-dashboard/CONTEXT.md`'s own rationale section for the child-process decision — the dashboard runs as a child process that outlives the cockpit pane, precisely so it does not vanish when the terminal closes). A surface that
only lives as long as a terminal pane is absent precisely when it is needed.
```

## claim_316763f2e8c486f23767f5235763a700

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#unheaded-block-4; lines 22–22; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Purpose"].
Target: docs/platform/herdr-web-dashboard/spec.md#unheaded-block-6; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Purpose"].
Source digest: 5505254e6beedd833219975b4c9da80989d411eb71c06cc1eb54b88cb9240c25
Target digest: 5505254e6beedd833219975b4c9da80989d411eb71c06cc1eb54b88cb9240c25
Shown source SHA256: 5505254e6beedd833219975b4c9da80989d411eb71c06cc1eb54b88cb9240c25
Shown target SHA256: 5505254e6beedd833219975b4c9da80989d411eb71c06cc1eb54b88cb9240c25

### Complete proposed decision

```json
{
  "claimId": "claim_316763f2e8c486f23767f5235763a700",
  "sourceUnitDigest": "5505254e6beedd833219975b4c9da80989d411eb71c06cc1eb54b88cb9240c25",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "unheaded-block-6",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole unheaded-block unit docs/specs/herdr-web-dashboard.md#unheaded-block-4 (source lines 22-22) is carried at docs/platform/herdr-web-dashboard/spec.md#unheaded-block-6 (candidate lines 44-44). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "5505254e6beedd833219975b4c9da80989d411eb71c06cc1eb54b88cb9240c25",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Purpose"
  ]
}
```

### Full source shown text

```text
Three things bound this surface:
```

### Full target shown text

```text
Three things bound this surface:
```

## claim_ba9a64fb389def2b21fce816844701ee

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#unheaded-block-5; lines 24–34; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Purpose"].
Target: docs/platform/herdr-web-dashboard/spec.md#unheaded-block-7; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Purpose"].
Source digest: 43742a6b577526fdf6a3e89da2aebda6d2c1b22533ba745d7b1a5399ba734fd5
Target digest: 43742a6b577526fdf6a3e89da2aebda6d2c1b22533ba745d7b1a5399ba734fd5
Shown source SHA256: 43742a6b577526fdf6a3e89da2aebda6d2c1b22533ba745d7b1a5399ba734fd5
Shown target SHA256: 43742a6b577526fdf6a3e89da2aebda6d2c1b22533ba745d7b1a5399ba734fd5

### Complete proposed decision

```json
{
  "claimId": "claim_ba9a64fb389def2b21fce816844701ee",
  "sourceUnitDigest": "43742a6b577526fdf6a3e89da2aebda6d2c1b22533ba745d7b1a5399ba734fd5",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "unheaded-block-7",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/herdr-web-dashboard.md#unheaded-block-5 (source lines 24-34) is carried at docs/platform/herdr-web-dashboard/spec.md#unheaded-block-7 (candidate lines 46-56). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "43742a6b577526fdf6a3e89da2aebda6d2c1b22533ba745d7b1a5399ba734fd5",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Purpose"
  ]
}
```

### Full source shown text

```text
- It runs **alongside** the herdr TUI, never replacing it (boundary: the web dashboard belongs to the fgos gateway, `apps/fgos-gateway/`; it runs alongside, not instead of, the `herdr-dashboard` TUI plugin). A
  person at a terminal keeps the TUI; the dashboard serves the person who is
  not at one.
- It is an **independent client project**, not server code inside the gateway
  (per fgos-interface-daemon — gateway and TUI sit behind hexagonal ports; the web client is a separate adapter calling in from outside). Its source lives at `apps/fgos-gateway/web/`; the fgos gateway embeds the built bundle and serves it, which is hosting, not ownership of any API logic. It calls the gateway's REST/RPC API from the outside,
  which is what decision `0014` requires of any non-terminal UI. An earlier
  decision of this feature (tsk-ldb's own — web dashboard as a new subsystem inside the former single herdr crate) proposed embedding an HTTP server
  directly in the former combined gateway-and-TUI binary (since split into `fgos-gateway` and `herdr-dashboard`); that branch is closed — cite fgos-interface-daemon's hexagonal-ports decision, not
  tsk-ldb's original one, for where the web client lives.
- It never becomes a second write path. Every change it makes goes through
  an fgOS one-door-write verb executed by the gateway (R2 below).
```

### Full target shown text

```text
- It runs **alongside** the herdr TUI, never replacing it (boundary: the web dashboard belongs to the fgos gateway, `apps/fgos-gateway/`; it runs alongside, not instead of, the `herdr-dashboard` TUI plugin). A
  person at a terminal keeps the TUI; the dashboard serves the person who is
  not at one.
- It is an **independent client project**, not server code inside the gateway
  (per fgos-interface-daemon — gateway and TUI sit behind hexagonal ports; the web client is a separate adapter calling in from outside). Its source lives at `apps/fgos-gateway/web/`; the fgos gateway embeds the built bundle and serves it, which is hosting, not ownership of any API logic. It calls the gateway's REST/RPC API from the outside,
  which is what decision `0014` requires of any non-terminal UI. An earlier
  decision of this feature (tsk-ldb's own — web dashboard as a new subsystem inside the former single herdr crate) proposed embedding an HTTP server
  directly in the former combined gateway-and-TUI binary (since split into `fgos-gateway` and `herdr-dashboard`); that branch is closed — cite fgos-interface-daemon's hexagonal-ports decision, not
  tsk-ldb's original one, for where the web client lives.
- It never becomes a second write path. Every change it makes goes through
  an fgOS one-door-write verb executed by the gateway (R2 below).
```

## claim_ec3a7b2ec42c939b9ac745b6bdbcf5c3

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#unheaded-block-6; lines 36–40; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Purpose"].
Target: docs/platform/herdr-web-dashboard/spec.md#unheaded-block-8; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Purpose"].
Source digest: 95e0c20e567a40e3bb624dd8e039e6f08b3f079260bbe5fba7a95b53f03197d8
Target digest: 95e0c20e567a40e3bb624dd8e039e6f08b3f079260bbe5fba7a95b53f03197d8
Shown source SHA256: 95e0c20e567a40e3bb624dd8e039e6f08b3f079260bbe5fba7a95b53f03197d8
Shown target SHA256: 95e0c20e567a40e3bb624dd8e039e6f08b3f079260bbe5fba7a95b53f03197d8

### Complete proposed decision

```json
{
  "claimId": "claim_ec3a7b2ec42c939b9ac745b6bdbcf5c3",
  "sourceUnitDigest": "95e0c20e567a40e3bb624dd8e039e6f08b3f079260bbe5fba7a95b53f03197d8",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "unheaded-block-8",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/herdr-web-dashboard.md#unheaded-block-6 (source lines 36-40) is carried at docs/platform/herdr-web-dashboard/spec.md#unheaded-block-8 (candidate lines 58-62). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "95e0c20e567a40e3bb624dd8e039e6f08b3f079260bbe5fba7a95b53f03197d8",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Purpose"
  ]
}
```

### Full source shown text

```text
**Out of scope for this spec.** Question authoring quality at the source
(`tsk-539`, deliberately decoupled — tsk-ldb and tsk-539 stay scope-separated). Multi-project port/identity
mechanics (`tsk-3b0` — multi-project port/identity handling is deferred to tsk-3b0). The concrete visual layout, colour and
typography (`tsk-3x6`, `docs/reference/herdr-web-dashboard-layout.md`) — this
spec states what an actor expects to be able to do, never how it is drawn.
```

### Full target shown text

```text
**Out of scope for this spec.** Question authoring quality at the source
(`tsk-539`, deliberately decoupled — tsk-ldb and tsk-539 stay scope-separated). Multi-project port/identity
mechanics (`tsk-3b0` — multi-project port/identity handling is deferred to tsk-3b0). The concrete visual layout, colour and
typography (`tsk-3x6`, `docs/reference/herdr-web-dashboard-layout.md`) — this
spec states what an actor expects to be able to do, never how it is drawn.
```

## claim_111f864d78a1bcae3e3c3c6b343a9ea5

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#entry-points-triggers; lines 42–42; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)"].
Target: docs/platform/herdr-web-dashboard/spec.md#entry-points-triggers; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)"].
Source digest: 44a01f946d9c3f460bbcf473ebb31d1c1911d455e66846c50ddd05c3fd30471e
Target digest: 44a01f946d9c3f460bbcf473ebb31d1c1911d455e66846c50ddd05c3fd30471e
Shown source SHA256: dfb5317711b169153f1dd3a3abef81f276e94a4cb48b0a1805cd5470b34fd11e
Shown target SHA256: dfb5317711b169153f1dd3a3abef81f276e94a4cb48b0a1805cd5470b34fd11e

### Complete proposed decision

```json
{
  "claimId": "claim_111f864d78a1bcae3e3c3c6b343a9ea5",
  "sourceUnitDigest": "44a01f946d9c3f460bbcf473ebb31d1c1911d455e66846c50ddd05c3fd30471e",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "entry-points-triggers",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/herdr-web-dashboard.md#entry-points-triggers (source lines 42-42) is carried at docs/platform/herdr-web-dashboard/spec.md#entry-points-triggers (candidate lines 64-64). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "44a01f946d9c3f460bbcf473ebb31d1c1911d455e66846c50ddd05c3fd30471e",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)"
  ]
}
```

### Full source shown text

```text
## Entry Points & Triggers

- **Open the dashboard.** A person opens the dashboard's address in a browser
  on any device that can reach the machine. The first interaction is always
  sign-in; there is no anonymous view (mandatory token auth from v1, not deferred to a later version).
- **Open the taskboard.** The default landing surface once signed in: every
  work item on the connected project, grouped so the person can see state at a
  glance.
- **Open one task's detail.** From the taskboard, or directly by address.
- **Open "questions needing answer".** The list of everything currently
  waiting on a person — covering **both** channels, `ask` questions and
  `gate-approve` questions (question-needing-answer covers both channels), not just the `ask` channel.
- **Availability trigger (not a person's action).** The dashboard is reachable
  whenever its own process is running. That process is started and stopped
  from the cockpit but **outlives the cockpit pane** — closing the cockpit does
  not stop the dashboard (it runs as a child process outliving the cockpit pane). It is enabled by default (its own config toggle defaults ON, unlike other auto-launch toggles), listens on the
  configured bind address (default reaches beyond loopback — binds 0.0.0.0 by default, bind address configurable, warns when non-loopback) and on port
  8788 (its config section carries a port field, defaulting to 8788).
- **No outbound trigger exists.** Nothing notifies the person that a question
  is waiting; they have to come and look. A push/attention channel is a
  different, unbuilt capability (`docs/io-contract.md` §Ranh giới — STR48).
```

### Full target shown text

```text
## Entry Points & Triggers

- **Open the dashboard.** A person opens the dashboard's address in a browser
  on any device that can reach the machine. The first interaction is always
  sign-in; there is no anonymous view (mandatory token auth from v1, not deferred to a later version).
- **Open the taskboard.** The default landing surface once signed in: every
  work item on the connected project, grouped so the person can see state at a
  glance.
- **Open one task's detail.** From the taskboard, or directly by address.
- **Open "questions needing answer".** The list of everything currently
  waiting on a person — covering **both** channels, `ask` questions and
  `gate-approve` questions (question-needing-answer covers both channels), not just the `ask` channel.
- **Availability trigger (not a person's action).** The dashboard is reachable
  whenever its own process is running. That process is started and stopped
  from the cockpit but **outlives the cockpit pane** — closing the cockpit does
  not stop the dashboard (it runs as a child process outliving the cockpit pane). It is enabled by default (its own config toggle defaults ON, unlike other auto-launch toggles), listens on the
  configured bind address (default reaches beyond loopback — binds 0.0.0.0 by default, bind address configurable, warns when non-loopback) and on port
  8788 (its config section carries a port field, defaulting to 8788).
- **No outbound trigger exists.** Nothing notifies the person that a question
  is waiting; they have to come and look. A push/attention channel is a
  different, unbuilt capability (`docs/io-contract.md` §Ranh giới — STR48).
```

## claim_5877600a52b4cf5568796da3c9044b65

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#unheaded-block-7; lines 44–62; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Entry Points & Triggers"].
Target: docs/platform/herdr-web-dashboard/spec.md#unheaded-block-9; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Entry Points & Triggers"].
Source digest: 6fe8b44476ba00c6aa3e5c46960ec7e060c6186fffd0f444669a3bc8950cb176
Target digest: 6fe8b44476ba00c6aa3e5c46960ec7e060c6186fffd0f444669a3bc8950cb176
Shown source SHA256: 6fe8b44476ba00c6aa3e5c46960ec7e060c6186fffd0f444669a3bc8950cb176
Shown target SHA256: 6fe8b44476ba00c6aa3e5c46960ec7e060c6186fffd0f444669a3bc8950cb176

### Complete proposed decision

```json
{
  "claimId": "claim_5877600a52b4cf5568796da3c9044b65",
  "sourceUnitDigest": "6fe8b44476ba00c6aa3e5c46960ec7e060c6186fffd0f444669a3bc8950cb176",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "unheaded-block-9",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/herdr-web-dashboard.md#unheaded-block-7 (source lines 44-62) is carried at docs/platform/herdr-web-dashboard/spec.md#unheaded-block-9 (candidate lines 66-84). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "6fe8b44476ba00c6aa3e5c46960ec7e060c6186fffd0f444669a3bc8950cb176",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Entry Points & Triggers"
  ]
}
```

### Full source shown text

```text
- **Open the dashboard.** A person opens the dashboard's address in a browser
  on any device that can reach the machine. The first interaction is always
  sign-in; there is no anonymous view (mandatory token auth from v1, not deferred to a later version).
- **Open the taskboard.** The default landing surface once signed in: every
  work item on the connected project, grouped so the person can see state at a
  glance.
- **Open one task's detail.** From the taskboard, or directly by address.
- **Open "questions needing answer".** The list of everything currently
  waiting on a person — covering **both** channels, `ask` questions and
  `gate-approve` questions (question-needing-answer covers both channels), not just the `ask` channel.
- **Availability trigger (not a person's action).** The dashboard is reachable
  whenever its own process is running. That process is started and stopped
  from the cockpit but **outlives the cockpit pane** — closing the cockpit does
  not stop the dashboard (it runs as a child process outliving the cockpit pane). It is enabled by default (its own config toggle defaults ON, unlike other auto-launch toggles), listens on the
  configured bind address (default reaches beyond loopback — binds 0.0.0.0 by default, bind address configurable, warns when non-loopback) and on port
  8788 (its config section carries a port field, defaulting to 8788).
- **No outbound trigger exists.** Nothing notifies the person that a question
  is waiting; they have to come and look. A push/attention channel is a
  different, unbuilt capability (`docs/io-contract.md` §Ranh giới — STR48).
```

### Full target shown text

```text
- **Open the dashboard.** A person opens the dashboard's address in a browser
  on any device that can reach the machine. The first interaction is always
  sign-in; there is no anonymous view (mandatory token auth from v1, not deferred to a later version).
- **Open the taskboard.** The default landing surface once signed in: every
  work item on the connected project, grouped so the person can see state at a
  glance.
- **Open one task's detail.** From the taskboard, or directly by address.
- **Open "questions needing answer".** The list of everything currently
  waiting on a person — covering **both** channels, `ask` questions and
  `gate-approve` questions (question-needing-answer covers both channels), not just the `ask` channel.
- **Availability trigger (not a person's action).** The dashboard is reachable
  whenever its own process is running. That process is started and stopped
  from the cockpit but **outlives the cockpit pane** — closing the cockpit does
  not stop the dashboard (it runs as a child process outliving the cockpit pane). It is enabled by default (its own config toggle defaults ON, unlike other auto-launch toggles), listens on the
  configured bind address (default reaches beyond loopback — binds 0.0.0.0 by default, bind address configurable, warns when non-loopback) and on port
  8788 (its config section carries a port field, defaulting to 8788).
- **No outbound trigger exists.** Nothing notifies the person that a question
  is waiting; they have to come and look. A push/attention channel is a
  different, unbuilt capability (`docs/io-contract.md` §Ranh giới — STR48).
```

## claim_401864f1cbebeef845e6609d3b039738

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#data-dictionary; lines 64–64; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)"].
Target: docs/platform/herdr-web-dashboard/spec.md#data-dictionary; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)"].
Source digest: 056d9384358a4968cb87e85349ad9854943900aa79f69da3c5dcc8a7515f77ba
Target digest: 056d9384358a4968cb87e85349ad9854943900aa79f69da3c5dcc8a7515f77ba
Shown source SHA256: 635655420ef6d3d8ebb8451e0077a26e4cd3e1263ca250ce9b68270c83f8c20e
Shown target SHA256: 635655420ef6d3d8ebb8451e0077a26e4cd3e1263ca250ce9b68270c83f8c20e

### Complete proposed decision

```json
{
  "claimId": "claim_401864f1cbebeef845e6609d3b039738",
  "sourceUnitDigest": "056d9384358a4968cb87e85349ad9854943900aa79f69da3c5dcc8a7515f77ba",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "data-dictionary",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/herdr-web-dashboard.md#data-dictionary (source lines 64-64) is carried at docs/platform/herdr-web-dashboard/spec.md#data-dictionary (candidate lines 86-86). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "056d9384358a4968cb87e85349ad9854943900aa79f69da3c5dcc8a7515f77ba",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)"
  ]
}
```

### Full source shown text

```text
## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|---------|---------|--------|----------|---------|
| 1 | Work item | One unit of tracked work, as fgOS defines it | see `docs/specs/work-state.md` — this surface introduces no new item shape | — | — |
| 2 | Status | Where the item sits in its lifecycle | fgOS's own status set (`todo`, `doing`, `awaiting-human`, `awaiting-approval`, `blocked`, `delivered`, `retrospective`, `cleanup`, `done`, `wontfix`) | yes | — |
| 3 | Stage | Where the item sits within the front of its lifecycle | the item's own domain's stage list | no (frozen from `awaiting-approval` on) | — |
| 4 | Question needing an answer | One thing waiting on a person; the union of the two channels | an `ask` question, or a `gate-approve` question (`contextApprove`/`planApprove`/`validateApprove`) | — | — |
| 5 | Answer | The person's reply that releases a waiting item | free text | yes, to answer | — |
| 6 | Agent work history | What the agent actually did on this item | narrative from the item's own `CONTEXT.md`/`plan.md` is the primary source; the machine-side decision log is expandable detail, not shown by default | — | narrative shown, machine log collapsed |
| 7 | Question/answer timeline | Questions paired with their answers across repeated park rounds | pairing is positional — the i-th recorded question pairs with the i-th recorded answer, ordered by sequence number | — | — |
| 8 | Sign-in session | Proof that this browser may act | a session established by presenting the machine token once | yes | — |
| 9 | Machine token | The single credential guarding the surface | resolved from the environment first, otherwise from a generated local secret file that is never committed | yes | generated on first run |
| 10 | Gateway endpoint | The gateway instance this client is talking to | an address; the client is built to hold **more than one** (per fgos-interface-daemon — a future desktop client aggregates one gateway per machine) | yes | — |
```

### Full target shown text

```text
## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|---------|---------|--------|----------|---------|
| 1 | Work item | One unit of tracked work, as fgOS defines it | see `docs/specs/work-state.md` — this surface introduces no new item shape | — | — |
| 2 | Status | Where the item sits in its lifecycle | fgOS's own status set (`todo`, `doing`, `awaiting-human`, `awaiting-approval`, `blocked`, `delivered`, `retrospective`, `cleanup`, `done`, `wontfix`) | yes | — |
| 3 | Stage | Where the item sits within the front of its lifecycle | the item's own domain's stage list | no (frozen from `awaiting-approval` on) | — |
| 4 | Question needing an answer | One thing waiting on a person; the union of the two channels | an `ask` question, or a `gate-approve` question (`contextApprove`/`planApprove`/`validateApprove`) | — | — |
| 5 | Answer | The person's reply that releases a waiting item | free text | yes, to answer | — |
| 6 | Agent work history | What the agent actually did on this item | narrative from the item's own `CONTEXT.md`/`plan.md` is the primary source; the machine-side decision log is expandable detail, not shown by default | — | narrative shown, machine log collapsed |
| 7 | Question/answer timeline | Questions paired with their answers across repeated park rounds | pairing is positional — the i-th recorded question pairs with the i-th recorded answer, ordered by sequence number | — | — |
| 8 | Sign-in session | Proof that this browser may act | a session established by presenting the machine token once | yes | — |
| 9 | Machine token | The single credential guarding the surface | resolved from the environment first, otherwise from a generated local secret file that is never committed | yes | generated on first run |
| 10 | Gateway endpoint | The gateway instance this client is talking to | an address; the client is built to hold **more than one** (per fgos-interface-daemon — a future desktop client aggregates one gateway per machine) | yes | — |
```

## claim_cdbe500eb5f501430eed0011898c2437

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#unheaded-block-8; lines 66–77; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Data Dictionary"].
Target: docs/platform/herdr-web-dashboard/spec.md#unheaded-block-10; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Data Dictionary"].
Source digest: 8e2f1fc09a1d0e22e5063a741ee91537bcccf3b7527fe5b49447c9c6c4526605
Target digest: 8e2f1fc09a1d0e22e5063a741ee91537bcccf3b7527fe5b49447c9c6c4526605
Shown source SHA256: 8e2f1fc09a1d0e22e5063a741ee91537bcccf3b7527fe5b49447c9c6c4526605
Shown target SHA256: 8e2f1fc09a1d0e22e5063a741ee91537bcccf3b7527fe5b49447c9c6c4526605

### Complete proposed decision

```json
{
  "claimId": "claim_cdbe500eb5f501430eed0011898c2437",
  "sourceUnitDigest": "8e2f1fc09a1d0e22e5063a741ee91537bcccf3b7527fe5b49447c9c6c4526605",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "unheaded-block-10",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/herdr-web-dashboard.md#unheaded-block-8 (source lines 66-77) is carried at docs/platform/herdr-web-dashboard/spec.md#unheaded-block-10 (candidate lines 88-99). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "8e2f1fc09a1d0e22e5063a741ee91537bcccf3b7527fe5b49447c9c6c4526605",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Data Dictionary"
  ]
}
```

### Full source shown text

```text
| # | Element | Meaning | Values | Required | Default |
|---|---------|---------|--------|----------|---------|
| 1 | Work item | One unit of tracked work, as fgOS defines it | see `docs/specs/work-state.md` — this surface introduces no new item shape | — | — |
| 2 | Status | Where the item sits in its lifecycle | fgOS's own status set (`todo`, `doing`, `awaiting-human`, `awaiting-approval`, `blocked`, `delivered`, `retrospective`, `cleanup`, `done`, `wontfix`) | yes | — |
| 3 | Stage | Where the item sits within the front of its lifecycle | the item's own domain's stage list | no (frozen from `awaiting-approval` on) | — |
| 4 | Question needing an answer | One thing waiting on a person; the union of the two channels | an `ask` question, or a `gate-approve` question (`contextApprove`/`planApprove`/`validateApprove`) | — | — |
| 5 | Answer | The person's reply that releases a waiting item | free text | yes, to answer | — |
| 6 | Agent work history | What the agent actually did on this item | narrative from the item's own `CONTEXT.md`/`plan.md` is the primary source; the machine-side decision log is expandable detail, not shown by default | — | narrative shown, machine log collapsed |
| 7 | Question/answer timeline | Questions paired with their answers across repeated park rounds | pairing is positional — the i-th recorded question pairs with the i-th recorded answer, ordered by sequence number | — | — |
| 8 | Sign-in session | Proof that this browser may act | a session established by presenting the machine token once | yes | — |
| 9 | Machine token | The single credential guarding the surface | resolved from the environment first, otherwise from a generated local secret file that is never committed | yes | generated on first run |
| 10 | Gateway endpoint | The gateway instance this client is talking to | an address; the client is built to hold **more than one** (per fgos-interface-daemon — a future desktop client aggregates one gateway per machine) | yes | — |
```

### Full target shown text

```text
| # | Element | Meaning | Values | Required | Default |
|---|---------|---------|--------|----------|---------|
| 1 | Work item | One unit of tracked work, as fgOS defines it | see `docs/specs/work-state.md` — this surface introduces no new item shape | — | — |
| 2 | Status | Where the item sits in its lifecycle | fgOS's own status set (`todo`, `doing`, `awaiting-human`, `awaiting-approval`, `blocked`, `delivered`, `retrospective`, `cleanup`, `done`, `wontfix`) | yes | — |
| 3 | Stage | Where the item sits within the front of its lifecycle | the item's own domain's stage list | no (frozen from `awaiting-approval` on) | — |
| 4 | Question needing an answer | One thing waiting on a person; the union of the two channels | an `ask` question, or a `gate-approve` question (`contextApprove`/`planApprove`/`validateApprove`) | — | — |
| 5 | Answer | The person's reply that releases a waiting item | free text | yes, to answer | — |
| 6 | Agent work history | What the agent actually did on this item | narrative from the item's own `CONTEXT.md`/`plan.md` is the primary source; the machine-side decision log is expandable detail, not shown by default | — | narrative shown, machine log collapsed |
| 7 | Question/answer timeline | Questions paired with their answers across repeated park rounds | pairing is positional — the i-th recorded question pairs with the i-th recorded answer, ordered by sequence number | — | — |
| 8 | Sign-in session | Proof that this browser may act | a session established by presenting the machine token once | yes | — |
| 9 | Machine token | The single credential guarding the surface | resolved from the environment first, otherwise from a generated local secret file that is never committed | yes | generated on first run |
| 10 | Gateway endpoint | The gateway instance this client is talking to | an address; the client is built to hold **more than one** (per fgos-interface-daemon — a future desktop client aggregates one gateway per machine) | yes | — |
```

## claim_041b58ea676c91fd6d94a0b4772202f2

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#behaviors-operations; lines 79–79; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)"].
Target: docs/platform/herdr-web-dashboard/spec.md#behaviors-operations; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)"].
Source digest: 082ab0793f07b48919cc224d5e470585bb8e77fea14f32c16a14ac05605500c9
Target digest: 082ab0793f07b48919cc224d5e470585bb8e77fea14f32c16a14ac05605500c9
Shown source SHA256: 166b62e15842d9e24f1992de481dfd4fd09045dc979091c89615cfb85e5e0ed0
Shown target SHA256: 166b62e15842d9e24f1992de481dfd4fd09045dc979091c89615cfb85e5e0ed0

### Complete proposed decision

```json
{
  "claimId": "claim_041b58ea676c91fd6d94a0b4772202f2",
  "sourceUnitDigest": "082ab0793f07b48919cc224d5e470585bb8e77fea14f32c16a14ac05605500c9",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "behaviors-operations",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/herdr-web-dashboard.md#behaviors-operations (source lines 79-79) is carried at docs/platform/herdr-web-dashboard/spec.md#behaviors-operations (candidate lines 101-101). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "082ab0793f07b48919cc224d5e470585bb8e77fea14f32c16a14ac05605500c9",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)"
  ]
}
```

### Full source shown text

```text
## Behaviors & Operations

Each operation below states the verb it goes through. That is load-bearing,
not decoration: the dashboard never writes fgOS state itself (R2).
```

### Full target shown text

```text
## Behaviors & Operations

Each operation below states the verb it goes through. That is load-bearing,
not decoration: the dashboard never writes fgOS state itself (R2).
```

## claim_7d20f3261994b06bf8aab4ce53375a6b

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#unheaded-block-9; lines 81–82; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations"].
Target: docs/platform/herdr-web-dashboard/spec.md#unheaded-block-11; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations"].
Source digest: 56ef9d1bb263a4c4ebb9bb6f14c8e76fc860e387d12b3bd162e9f7758fa7523a
Target digest: 56ef9d1bb263a4c4ebb9bb6f14c8e76fc860e387d12b3bd162e9f7758fa7523a
Shown source SHA256: 56ef9d1bb263a4c4ebb9bb6f14c8e76fc860e387d12b3bd162e9f7758fa7523a
Shown target SHA256: 56ef9d1bb263a4c4ebb9bb6f14c8e76fc860e387d12b3bd162e9f7758fa7523a

### Complete proposed decision

```json
{
  "claimId": "claim_7d20f3261994b06bf8aab4ce53375a6b",
  "sourceUnitDigest": "56ef9d1bb263a4c4ebb9bb6f14c8e76fc860e387d12b3bd162e9f7758fa7523a",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "unheaded-block-11",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/herdr-web-dashboard.md#unheaded-block-9 (source lines 81-82) is carried at docs/platform/herdr-web-dashboard/spec.md#unheaded-block-11 (candidate lines 103-104). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "56ef9d1bb263a4c4ebb9bb6f14c8e76fc860e387d12b3bd162e9f7758fa7523a",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Behaviors & Operations"
  ]
}
```

### Full source shown text

```text
Each operation below states the verb it goes through. That is load-bearing,
not decoration: the dashboard never writes fgOS state itself (R2).
```

### Full target shown text

```text
Each operation below states the verb it goes through. That is load-bearing,
not decoration: the dashboard never writes fgOS state itself (R2).
```

## claim_c05db90b99b33fe90126ccbbfedb2dd6

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#sign-in; lines 84–84; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations"].
Target: docs/platform/herdr-web-dashboard/spec.md#sign-in; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations"].
Source digest: 29bf5d1958f9e29181d0a5a30d28b209340cce42f411c1eccfe918f454e6b37c
Target digest: 29bf5d1958f9e29181d0a5a30d28b209340cce42f411c1eccfe918f454e6b37c
Shown source SHA256: 9399676189a3784389a190c7214092a67a7ea2932467a3771319548d8a451e91
Shown target SHA256: 9399676189a3784389a190c7214092a67a7ea2932467a3771319548d8a451e91

### Complete proposed decision

```json
{
  "claimId": "claim_c05db90b99b33fe90126ccbbfedb2dd6",
  "sourceUnitDigest": "29bf5d1958f9e29181d0a5a30d28b209340cce42f411c1eccfe918f454e6b37c",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "sign-in",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/herdr-web-dashboard.md#sign-in (source lines 84-84) is carried at docs/platform/herdr-web-dashboard/spec.md#sign-in (candidate lines 106-106). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "29bf5d1958f9e29181d0a5a30d28b209340cce42f411c1eccfe918f454e6b37c",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Behaviors & Operations"
  ]
}
```

### Full source shown text

```text
### Sign in

- **Blocked when:** the presented credential does not match. Every failure —
  wrong token, malformed request, unknown route — looks identical from
  outside: the surface gives back nothing that distinguishes "wrong token"
  from "nothing here" (every auth failure returns an opaque 404, never 401).
- **What changes:** a session is established for this browser.
- **Side effects:** none on work state.
- **Afterwards:** the person lands on the taskboard.
```

### Full target shown text

```text
### Sign in

- **Blocked when:** the presented credential does not match. Every failure —
  wrong token, malformed request, unknown route — looks identical from
  outside: the surface gives back nothing that distinguishes "wrong token"
  from "nothing here" (every auth failure returns an opaque 404, never 401).
- **What changes:** a session is established for this browser.
- **Side effects:** none on work state.
- **Afterwards:** the person lands on the taskboard.
```

## claim_8fc8f5d9d754055cd3192f32178f0ef8

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#unheaded-block-10; lines 86–92; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations","Sign in"].
Target: docs/platform/herdr-web-dashboard/spec.md#unheaded-block-12; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations","Sign in"].
Source digest: fa5bf141c33adf0feb5f6118ac5d549d6c8b49a74dc1bbd5c5ef5b12b54f90a3
Target digest: fa5bf141c33adf0feb5f6118ac5d549d6c8b49a74dc1bbd5c5ef5b12b54f90a3
Shown source SHA256: fa5bf141c33adf0feb5f6118ac5d549d6c8b49a74dc1bbd5c5ef5b12b54f90a3
Shown target SHA256: fa5bf141c33adf0feb5f6118ac5d549d6c8b49a74dc1bbd5c5ef5b12b54f90a3

### Complete proposed decision

```json
{
  "claimId": "claim_8fc8f5d9d754055cd3192f32178f0ef8",
  "sourceUnitDigest": "fa5bf141c33adf0feb5f6118ac5d549d6c8b49a74dc1bbd5c5ef5b12b54f90a3",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "unheaded-block-12",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/herdr-web-dashboard.md#unheaded-block-10 (source lines 86-92) is carried at docs/platform/herdr-web-dashboard/spec.md#unheaded-block-12 (candidate lines 108-114). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "fa5bf141c33adf0feb5f6118ac5d549d6c8b49a74dc1bbd5c5ef5b12b54f90a3",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Behaviors & Operations",
    "Sign in"
  ]
}
```

### Full source shown text

```text
- **Blocked when:** the presented credential does not match. Every failure —
  wrong token, malformed request, unknown route — looks identical from
  outside: the surface gives back nothing that distinguishes "wrong token"
  from "nothing here" (every auth failure returns an opaque 404, never 401).
- **What changes:** a session is established for this browser.
- **Side effects:** none on work state.
- **Afterwards:** the person lands on the taskboard.
```

### Full target shown text

```text
- **Blocked when:** the presented credential does not match. Every failure —
  wrong token, malformed request, unknown route — looks identical from
  outside: the surface gives back nothing that distinguishes "wrong token"
  from "nothing here" (every auth failure returns an opaque 404, never 401).
- **What changes:** a session is established for this browser.
- **Side effects:** none on work state.
- **Afterwards:** the person lands on the taskboard.
```

## claim_112ba0e0b60b13aa2b6cef0cc605851e

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#view-the-taskboard; lines 94–94; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations"].
Target: docs/platform/herdr-web-dashboard/spec.md#view-the-taskboard; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations"].
Source digest: 3bb8852a0023788101d2a06064c4545cb7432ea4adc39f629083541c050d0889
Target digest: 3bb8852a0023788101d2a06064c4545cb7432ea4adc39f629083541c050d0889
Shown source SHA256: 5f693e16e62370e4de11fda6e900818052e5912e71ee6c37e92abd03423bd2de
Shown target SHA256: 5f693e16e62370e4de11fda6e900818052e5912e71ee6c37e92abd03423bd2de

### Complete proposed decision

```json
{
  "claimId": "claim_112ba0e0b60b13aa2b6cef0cc605851e",
  "sourceUnitDigest": "3bb8852a0023788101d2a06064c4545cb7432ea4adc39f629083541c050d0889",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "view-the-taskboard",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/herdr-web-dashboard.md#view-the-taskboard (source lines 94-94) is carried at docs/platform/herdr-web-dashboard/spec.md#view-the-taskboard (candidate lines 116-116). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "3bb8852a0023788101d2a06064c4545cb7432ea4adc39f629083541c050d0889",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Behaviors & Operations"
  ]
}
```

### Full source shown text

```text
### View the taskboard

- **Blocked when:** not signed in.
- **What changes:** nothing — this is a read.
- **Side effects:** none.
- **Afterwards:** the person sees every work item on the connected project.
  **The actor-facing expectation is a board, not a flat table** — the
  reference experience is Monday.com/ClickUp: items grouped by status, state
  legible at a glance, quick actions reachable in place without opening the
  item, and controls to filter and regroup. What that looks like concretely —
  layout, colour, spacing, typography — belongs to `tsk-3x6`, not here.
```

### Full target shown text

```text
### View the taskboard

- **Blocked when:** not signed in.
- **What changes:** nothing — this is a read.
- **Side effects:** none.
- **Afterwards:** the person sees every work item on the connected project.
  **The actor-facing expectation is a board, not a flat table** — the
  reference experience is Monday.com/ClickUp: items grouped by status, state
  legible at a glance, quick actions reachable in place without opening the
  item, and controls to filter and regroup. What that looks like concretely —
  layout, colour, spacing, typography — belongs to `tsk-3x6`, not here.
```

## claim_713e8533374a977b44c019d9296ff88f

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#unheaded-block-11; lines 96–104; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations","View the taskboard"].
Target: docs/platform/herdr-web-dashboard/spec.md#unheaded-block-13; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations","View the taskboard"].
Source digest: 5dd7066702c3791b0b10a5648dbf72eadbd6caa22a72d2315ccbc363474cfd2d
Target digest: 5dd7066702c3791b0b10a5648dbf72eadbd6caa22a72d2315ccbc363474cfd2d
Shown source SHA256: 5dd7066702c3791b0b10a5648dbf72eadbd6caa22a72d2315ccbc363474cfd2d
Shown target SHA256: 5dd7066702c3791b0b10a5648dbf72eadbd6caa22a72d2315ccbc363474cfd2d

### Complete proposed decision

```json
{
  "claimId": "claim_713e8533374a977b44c019d9296ff88f",
  "sourceUnitDigest": "5dd7066702c3791b0b10a5648dbf72eadbd6caa22a72d2315ccbc363474cfd2d",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "unheaded-block-13",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/herdr-web-dashboard.md#unheaded-block-11 (source lines 96-104) is carried at docs/platform/herdr-web-dashboard/spec.md#unheaded-block-13 (candidate lines 118-126). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "5dd7066702c3791b0b10a5648dbf72eadbd6caa22a72d2315ccbc363474cfd2d",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Behaviors & Operations",
    "View the taskboard"
  ]
}
```

### Full source shown text

```text
- **Blocked when:** not signed in.
- **What changes:** nothing — this is a read.
- **Side effects:** none.
- **Afterwards:** the person sees every work item on the connected project.
  **The actor-facing expectation is a board, not a flat table** — the
  reference experience is Monday.com/ClickUp: items grouped by status, state
  legible at a glance, quick actions reachable in place without opening the
  item, and controls to filter and regroup. What that looks like concretely —
  layout, colour, spacing, typography — belongs to `tsk-3x6`, not here.
```

### Full target shown text

```text
- **Blocked when:** not signed in.
- **What changes:** nothing — this is a read.
- **Side effects:** none.
- **Afterwards:** the person sees every work item on the connected project.
  **The actor-facing expectation is a board, not a flat table** — the
  reference experience is Monday.com/ClickUp: items grouped by status, state
  legible at a glance, quick actions reachable in place without opening the
  item, and controls to filter and regroup. What that looks like concretely —
  layout, colour, spacing, typography — belongs to `tsk-3x6`, not here.
```

## claim_2f001429d74fb896c6cbefc04c4a6936

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#view-a-tasks-detail; lines 106–106; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations"].
Target: docs/platform/herdr-web-dashboard/spec.md#view-a-tasks-detail; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations"].
Source digest: 4c6c04a8e9cf839adac66a55b2fc9c84b8bbbee138afd8d8d25626f9ec217500
Target digest: 4c6c04a8e9cf839adac66a55b2fc9c84b8bbbee138afd8d8d25626f9ec217500
Shown source SHA256: 305e6852a27262ef8f5c6a94639452b16a4a89c9a3796784200a4d1451b317e2
Shown target SHA256: 305e6852a27262ef8f5c6a94639452b16a4a89c9a3796784200a4d1451b317e2

### Complete proposed decision

```json
{
  "claimId": "claim_2f001429d74fb896c6cbefc04c4a6936",
  "sourceUnitDigest": "4c6c04a8e9cf839adac66a55b2fc9c84b8bbbee138afd8d8d25626f9ec217500",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "view-a-tasks-detail",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/herdr-web-dashboard.md#view-a-tasks-detail (source lines 106-106) is carried at docs/platform/herdr-web-dashboard/spec.md#view-a-tasks-detail (candidate lines 128-128). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "4c6c04a8e9cf839adac66a55b2fc9c84b8bbbee138afd8d8d25626f9ec217500",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Behaviors & Operations"
  ]
}
```

### Full source shown text

```text
### View a task's detail

- **Blocked when:** not signed in, or the item does not exist.
- **What changes:** nothing — this is a read.
- **Side effects:** none.
- **Afterwards:** the person sees, for that one item: what the agent did
  (narrative first, machine decision log available but collapsed), and
  the question/answer timeline across however many rounds the item has been
  parked. This screen is the core deliverable of the whole surface; the
  taskboard exists mainly to reach it.
```

### Full target shown text

```text
### View a task's detail

- **Blocked when:** not signed in, or the item does not exist.
- **What changes:** nothing — this is a read.
- **Side effects:** none.
- **Afterwards:** the person sees, for that one item: what the agent did
  (narrative first, machine decision log available but collapsed), and
  the question/answer timeline across however many rounds the item has been
  parked. This screen is the core deliverable of the whole surface; the
  taskboard exists mainly to reach it.
```

## claim_0af7828129bb0ef344d1aff694b04b63

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#unheaded-block-12; lines 108–115; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations","View a task's detail"].
Target: docs/platform/herdr-web-dashboard/spec.md#unheaded-block-14; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations","View a task's detail"].
Source digest: fddea92eb03048fc39ca8e07c7d5d6648080519149c35168970e5c5314579ceb
Target digest: fddea92eb03048fc39ca8e07c7d5d6648080519149c35168970e5c5314579ceb
Shown source SHA256: fddea92eb03048fc39ca8e07c7d5d6648080519149c35168970e5c5314579ceb
Shown target SHA256: fddea92eb03048fc39ca8e07c7d5d6648080519149c35168970e5c5314579ceb

### Complete proposed decision

```json
{
  "claimId": "claim_0af7828129bb0ef344d1aff694b04b63",
  "sourceUnitDigest": "fddea92eb03048fc39ca8e07c7d5d6648080519149c35168970e5c5314579ceb",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "unheaded-block-14",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/herdr-web-dashboard.md#unheaded-block-12 (source lines 108-115) is carried at docs/platform/herdr-web-dashboard/spec.md#unheaded-block-14 (candidate lines 130-137). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "fddea92eb03048fc39ca8e07c7d5d6648080519149c35168970e5c5314579ceb",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Behaviors & Operations",
    "View a task's detail"
  ]
}
```

### Full source shown text

```text
- **Blocked when:** not signed in, or the item does not exist.
- **What changes:** nothing — this is a read.
- **Side effects:** none.
- **Afterwards:** the person sees, for that one item: what the agent did
  (narrative first, machine decision log available but collapsed), and
  the question/answer timeline across however many rounds the item has been
  parked. This screen is the core deliverable of the whole surface; the
  taskboard exists mainly to reach it.
```

### Full target shown text

```text
- **Blocked when:** not signed in, or the item does not exist.
- **What changes:** nothing — this is a read.
- **Side effects:** none.
- **Afterwards:** the person sees, for that one item: what the agent did
  (narrative first, machine decision log available but collapsed), and
  the question/answer timeline across however many rounds the item has been
  parked. This screen is the core deliverable of the whole surface; the
  taskboard exists mainly to reach it.
```

## claim_e4816bd194fd7cd72cde750ee0542bc3

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#answer-a-parked-question; lines 117–117; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations"].
Target: docs/platform/herdr-web-dashboard/spec.md#answer-a-parked-question; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations"].
Source digest: 121b4db8a77c193d9b004fc14e6a0378aa9011932370640160d9642a1b3f0098
Target digest: 121b4db8a77c193d9b004fc14e6a0378aa9011932370640160d9642a1b3f0098
Shown source SHA256: 87e52c4706d47e0f68aba4dc3e6fc5c6857c015d6381b8a021d7e444e6ff47ec
Shown target SHA256: 87e52c4706d47e0f68aba4dc3e6fc5c6857c015d6381b8a021d7e444e6ff47ec

### Complete proposed decision

```json
{
  "claimId": "claim_e4816bd194fd7cd72cde750ee0542bc3",
  "sourceUnitDigest": "121b4db8a77c193d9b004fc14e6a0378aa9011932370640160d9642a1b3f0098",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "answer-a-parked-question",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/herdr-web-dashboard.md#answer-a-parked-question (source lines 117-117) is carried at docs/platform/herdr-web-dashboard/spec.md#answer-a-parked-question (candidate lines 139-139). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "121b4db8a77c193d9b004fc14e6a0378aa9011932370640160d9642a1b3f0098",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Behaviors & Operations"
  ]
}
```

### Full source shown text

```text
### Answer a parked question

- **Blocked when:** not signed in; or the item is not actually waiting on a
  person (its own lifecycle rules refuse the change, and that refusal is what
  the person sees).
- **What changes:** the answer is recorded and the item resumes, through the
  fgOS `answer` verb.
- **Side effects:** the item leaves the "questions needing answer" list.
- **Afterwards:** the person sees the item's new state. Answering happens
  **in place, on this surface** — the person is not sent to a terminal. This
  settles the question left open when the question-needing-answer decision established only that the screen
  *surfaces* both channels: the gateway is already the component that runs
  fgOS write verbs on a client's behalf, and `answer` is named among them
  (fgos-interface-daemon's own chokepoint decision), so sending the person out to a CLI would contradict the
  contract this client is written against.
```

### Full target shown text

```text
### Answer a parked question

- **Blocked when:** not signed in; or the item is not actually waiting on a
  person (its own lifecycle rules refuse the change, and that refusal is what
  the person sees).
- **What changes:** the answer is recorded and the item resumes, through the
  fgOS `answer` verb.
- **Side effects:** the item leaves the "questions needing answer" list.
- **Afterwards:** the person sees the item's new state. Answering happens
  **in place, on this surface** — the person is not sent to a terminal. This
  settles the question left open when the question-needing-answer decision established only that the screen
  *surfaces* both channels: the gateway is already the component that runs
  fgOS write verbs on a client's behalf, and `answer` is named among them
  (fgos-interface-daemon's own chokepoint decision), so sending the person out to a CLI would contradict the
  contract this client is written against.
```

## claim_9d613c56217c5da75868821a335fafbc

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#unheaded-block-13; lines 119–131; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations","Answer a parked question"].
Target: docs/platform/herdr-web-dashboard/spec.md#unheaded-block-15; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations","Answer a parked question"].
Source digest: 02c2abfc0e3fe0906c987d5096cd89e700df4ddfdb6c624d8ca8c5014e313208
Target digest: 02c2abfc0e3fe0906c987d5096cd89e700df4ddfdb6c624d8ca8c5014e313208
Shown source SHA256: 02c2abfc0e3fe0906c987d5096cd89e700df4ddfdb6c624d8ca8c5014e313208
Shown target SHA256: 02c2abfc0e3fe0906c987d5096cd89e700df4ddfdb6c624d8ca8c5014e313208

### Complete proposed decision

```json
{
  "claimId": "claim_9d613c56217c5da75868821a335fafbc",
  "sourceUnitDigest": "02c2abfc0e3fe0906c987d5096cd89e700df4ddfdb6c624d8ca8c5014e313208",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "unheaded-block-15",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/herdr-web-dashboard.md#unheaded-block-13 (source lines 119-131) is carried at docs/platform/herdr-web-dashboard/spec.md#unheaded-block-15 (candidate lines 141-153). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "02c2abfc0e3fe0906c987d5096cd89e700df4ddfdb6c624d8ca8c5014e313208",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Behaviors & Operations",
    "Answer a parked question"
  ]
}
```

### Full source shown text

```text
- **Blocked when:** not signed in; or the item is not actually waiting on a
  person (its own lifecycle rules refuse the change, and that refusal is what
  the person sees).
- **What changes:** the answer is recorded and the item resumes, through the
  fgOS `answer` verb.
- **Side effects:** the item leaves the "questions needing answer" list.
- **Afterwards:** the person sees the item's new state. Answering happens
  **in place, on this surface** — the person is not sent to a terminal. This
  settles the question left open when the question-needing-answer decision established only that the screen
  *surfaces* both channels: the gateway is already the component that runs
  fgOS write verbs on a client's behalf, and `answer` is named among them
  (fgos-interface-daemon's own chokepoint decision), so sending the person out to a CLI would contradict the
  contract this client is written against.
```

### Full target shown text

```text
- **Blocked when:** not signed in; or the item is not actually waiting on a
  person (its own lifecycle rules refuse the change, and that refusal is what
  the person sees).
- **What changes:** the answer is recorded and the item resumes, through the
  fgOS `answer` verb.
- **Side effects:** the item leaves the "questions needing answer" list.
- **Afterwards:** the person sees the item's new state. Answering happens
  **in place, on this surface** — the person is not sent to a terminal. This
  settles the question left open when the question-needing-answer decision established only that the screen
  *surfaces* both channels: the gateway is already the component that runs
  fgOS write verbs on a client's behalf, and `answer` is named among them
  (fgos-interface-daemon's own chokepoint decision), so sending the person out to a CLI would contradict the
  contract this client is written against.
```

## claim_62afe657fd22865fb6384797ba8b2803

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#approve-a-merge; lines 133–133; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations"].
Target: docs/platform/herdr-web-dashboard/spec.md#approve-a-merge; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations"].
Source digest: dda55d405c2cee1c6f03f9706fc117d86cf9bd41ee1a4dfeab9d82390a888637
Target digest: dda55d405c2cee1c6f03f9706fc117d86cf9bd41ee1a4dfeab9d82390a888637
Shown source SHA256: c8aa3427b87422bb9a7308bd1555ca6856572b1d4750b535b4534a3c7328f241
Shown target SHA256: c8aa3427b87422bb9a7308bd1555ca6856572b1d4750b535b4534a3c7328f241

### Complete proposed decision

```json
{
  "claimId": "claim_62afe657fd22865fb6384797ba8b2803",
  "sourceUnitDigest": "dda55d405c2cee1c6f03f9706fc117d86cf9bd41ee1a4dfeab9d82390a888637",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "approve-a-merge",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/herdr-web-dashboard.md#approve-a-merge (source lines 133-133) is carried at docs/platform/herdr-web-dashboard/spec.md#approve-a-merge (candidate lines 155-155). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "dda55d405c2cee1c6f03f9706fc117d86cf9bd41ee1a4dfeab9d82390a888637",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Behaviors & Operations"
  ]
}
```

### Full source shown text

```text
### Approve a merge

- **Blocked when:** not signed in; or the item is not at the point where a
  merge decision applies; or the gateway is not positioned to run the verb
  (see R7 — `approve` refuses to run anywhere but the repository's main
  working tree).
- **What changes:** the merge decision is recorded and the merge is performed,
  through the fgOS `approve` verb.
- **Side effects:** **this changes trunk.** It is the only operation on this
  surface that does, and it is the reason the exposure note in R8 exists.
- **Afterwards:** the person sees the outcome, including a failure that left
  the item blocked rather than merged.
```

### Full target shown text

```text
### Approve a merge

- **Blocked when:** not signed in; or the item is not at the point where a
  merge decision applies; or the gateway is not positioned to run the verb
  (see R7 — `approve` refuses to run anywhere but the repository's main
  working tree).
- **What changes:** the merge decision is recorded and the merge is performed,
  through the fgOS `approve` verb.
- **Side effects:** **this changes trunk.** It is the only operation on this
  surface that does, and it is the reason the exposure note in R8 exists.
- **Afterwards:** the person sees the outcome, including a failure that left
  the item blocked rather than merged.
```

## claim_9d7b246d0d09f47c6fe718ca58c8d36b

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#unheaded-block-14; lines 135–144; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations","Approve a merge"].
Target: docs/platform/herdr-web-dashboard/spec.md#unheaded-block-16; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations","Approve a merge"].
Source digest: 56f851b8da5f2ef6070d3123168a84c84275cab6214cc0bc5c53c5fcfebf70a7
Target digest: 56f851b8da5f2ef6070d3123168a84c84275cab6214cc0bc5c53c5fcfebf70a7
Shown source SHA256: 56f851b8da5f2ef6070d3123168a84c84275cab6214cc0bc5c53c5fcfebf70a7
Shown target SHA256: 56f851b8da5f2ef6070d3123168a84c84275cab6214cc0bc5c53c5fcfebf70a7

### Complete proposed decision

```json
{
  "claimId": "claim_9d7b246d0d09f47c6fe718ca58c8d36b",
  "sourceUnitDigest": "56f851b8da5f2ef6070d3123168a84c84275cab6214cc0bc5c53c5fcfebf70a7",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "unheaded-block-16",
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/herdr-web-dashboard.md#unheaded-block-14 (source lines 135-144) is carried at docs/platform/herdr-web-dashboard/spec.md#unheaded-block-16 (candidate lines 157-166). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "56f851b8da5f2ef6070d3123168a84c84275cab6214cc0bc5c53c5fcfebf70a7",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Behaviors & Operations",
    "Approve a merge"
  ]
}
```

### Full source shown text

```text
- **Blocked when:** not signed in; or the item is not at the point where a
  merge decision applies; or the gateway is not positioned to run the verb
  (see R7 — `approve` refuses to run anywhere but the repository's main
  working tree).
- **What changes:** the merge decision is recorded and the merge is performed,
  through the fgOS `approve` verb.
- **Side effects:** **this changes trunk.** It is the only operation on this
  surface that does, and it is the reason the exposure note in R8 exists.
- **Afterwards:** the person sees the outcome, including a failure that left
  the item blocked rather than merged.
```

### Full target shown text

```text
- **Blocked when:** not signed in; or the item is not at the point where a
  merge decision applies; or the gateway is not positioned to run the verb
  (see R7 — `approve` refuses to run anywhere but the repository's main
  working tree).
- **What changes:** the merge decision is recorded and the merge is performed,
  through the fgOS `approve` verb.
- **Side effects:** **this changes trunk.** It is the only operation on this
  surface that does, and it is the reason the exposure note in R8 exists.
- **Afterwards:** the person sees the outcome, including a failure that left
  the item blocked rather than merged.
```

## claim_4058c2cbc13660c9131a073491489bcf

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#add-a-work-item; lines 146–146; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations"].
Target: docs/platform/herdr-web-dashboard/spec.md#add-a-work-item; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations"].
Source digest: 6c1a2d0d5002be77b1c85ce17b652106f39f121388c6b9356ac61992ad455bd3
Target digest: 6c1a2d0d5002be77b1c85ce17b652106f39f121388c6b9356ac61992ad455bd3
Shown source SHA256: 65b4d98b8802d7ed4e6852e2dbd85287c5e4d17c2971b2c53938bd3116cb163d
Shown target SHA256: 65b4d98b8802d7ed4e6852e2dbd85287c5e4d17c2971b2c53938bd3116cb163d

### Complete proposed decision

```json
{
  "claimId": "claim_4058c2cbc13660c9131a073491489bcf",
  "sourceUnitDigest": "6c1a2d0d5002be77b1c85ce17b652106f39f121388c6b9356ac61992ad455bd3",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "add-a-work-item",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/herdr-web-dashboard.md#add-a-work-item (source lines 146-146) is carried at docs/platform/herdr-web-dashboard/spec.md#add-a-work-item (candidate lines 168-168). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "6c1a2d0d5002be77b1c85ce17b652106f39f121388c6b9356ac61992ad455bd3",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Behaviors & Operations"
  ]
}
```

### Full source shown text

```text
### Add a work item

- **Blocked when:** not signed in, or the description is empty.
- **What changes:** a new work item is created through the fgOS intake verb.
- **Side effects:** none beyond the new item.
- **Afterwards:** the person sees the new item's id and its derived fields.
```

### Full target shown text

```text
### Add a work item

- **Blocked when:** not signed in, or the description is empty.
- **What changes:** a new work item is created through the fgOS intake verb.
- **Side effects:** none beyond the new item.
- **Afterwards:** the person sees the new item's id and its derived fields.
```

## claim_027ad55814e7186aae754658b36a3da4

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#unheaded-block-15; lines 148–151; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations","Add a work item"].
Target: docs/platform/herdr-web-dashboard/spec.md#unheaded-block-17; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations","Add a work item"].
Source digest: 4e9dfc7b870ed0c42ee01256f4dd11e3147a0fbcfee3110d924ca2a91bf50c4b
Target digest: 4e9dfc7b870ed0c42ee01256f4dd11e3147a0fbcfee3110d924ca2a91bf50c4b
Shown source SHA256: 4e9dfc7b870ed0c42ee01256f4dd11e3147a0fbcfee3110d924ca2a91bf50c4b
Shown target SHA256: 4e9dfc7b870ed0c42ee01256f4dd11e3147a0fbcfee3110d924ca2a91bf50c4b

### Complete proposed decision

```json
{
  "claimId": "claim_027ad55814e7186aae754658b36a3da4",
  "sourceUnitDigest": "4e9dfc7b870ed0c42ee01256f4dd11e3147a0fbcfee3110d924ca2a91bf50c4b",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "unheaded-block-17",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/herdr-web-dashboard.md#unheaded-block-15 (source lines 148-151) is carried at docs/platform/herdr-web-dashboard/spec.md#unheaded-block-17 (candidate lines 170-173). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "4e9dfc7b870ed0c42ee01256f4dd11e3147a0fbcfee3110d924ca2a91bf50c4b",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Behaviors & Operations",
    "Add a work item"
  ]
}
```

### Full source shown text

```text
- **Blocked when:** not signed in, or the description is empty.
- **What changes:** a new work item is created through the fgOS intake verb.
- **Side effects:** none beyond the new item.
- **Afterwards:** the person sees the new item's id and its derived fields.
```

### Full target shown text

```text
- **Blocked when:** not signed in, or the description is empty.
- **What changes:** a new work item is created through the fgOS intake verb.
- **Side effects:** none beyond the new item.
- **Afterwards:** the person sees the new item's id and its derived fields.
```

## claim_663e6a3f4590e633d46c480b812428d6

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#edit-a-work-item; lines 153–153; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations"].
Target: docs/platform/herdr-web-dashboard/spec.md#edit-a-work-item; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations"].
Source digest: f46dae5b90188ed598fd3b80b6905e07a60bf36443fcd0e9c15bb21f0ef33d78
Target digest: f46dae5b90188ed598fd3b80b6905e07a60bf36443fcd0e9c15bb21f0ef33d78
Shown source SHA256: 723ef277525c90966a413f9042c912f2fe1bcd81573b1907be78672aa856ab2a
Shown target SHA256: 723ef277525c90966a413f9042c912f2fe1bcd81573b1907be78672aa856ab2a

### Complete proposed decision

```json
{
  "claimId": "claim_663e6a3f4590e633d46c480b812428d6",
  "sourceUnitDigest": "f46dae5b90188ed598fd3b80b6905e07a60bf36443fcd0e9c15bb21f0ef33d78",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "edit-a-work-item",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/herdr-web-dashboard.md#edit-a-work-item (source lines 153-153) is carried at docs/platform/herdr-web-dashboard/spec.md#edit-a-work-item (candidate lines 175-175). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "f46dae5b90188ed598fd3b80b6905e07a60bf36443fcd0e9c15bb21f0ef33d78",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Behaviors & Operations"
  ]
}
```

### Full source shown text

```text
### Edit a work item

- **Blocked when:** not signed in, or the target item does not exist.
- **What changes:** the named fields are overwritten through the fgOS `edit`
  verb, which applies the same validation a terminal edit gets.
- **Side effects:** none beyond the item.
- **Afterwards:** the person sees the item's updated fields.
```

### Full target shown text

```text
### Edit a work item

- **Blocked when:** not signed in, or the target item does not exist.
- **What changes:** the named fields are overwritten through the fgOS `edit`
  verb, which applies the same validation a terminal edit gets.
- **Side effects:** none beyond the item.
- **Afterwards:** the person sees the item's updated fields.
```

## claim_8103c8b9283356118e1c5f0126d387da

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#unheaded-block-16; lines 155–159; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations","Edit a work item"].
Target: docs/platform/herdr-web-dashboard/spec.md#unheaded-block-18; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations","Edit a work item"].
Source digest: 2f88434b367c4e8e15004d9d8dc0176f0c18d30dda2922a07a2272af81036838
Target digest: 2f88434b367c4e8e15004d9d8dc0176f0c18d30dda2922a07a2272af81036838
Shown source SHA256: 2f88434b367c4e8e15004d9d8dc0176f0c18d30dda2922a07a2272af81036838
Shown target SHA256: 2f88434b367c4e8e15004d9d8dc0176f0c18d30dda2922a07a2272af81036838

### Complete proposed decision

```json
{
  "claimId": "claim_8103c8b9283356118e1c5f0126d387da",
  "sourceUnitDigest": "2f88434b367c4e8e15004d9d8dc0176f0c18d30dda2922a07a2272af81036838",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "unheaded-block-18",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/herdr-web-dashboard.md#unheaded-block-16 (source lines 155-159) is carried at docs/platform/herdr-web-dashboard/spec.md#unheaded-block-18 (candidate lines 177-181). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "2f88434b367c4e8e15004d9d8dc0176f0c18d30dda2922a07a2272af81036838",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Behaviors & Operations",
    "Edit a work item"
  ]
}
```

### Full source shown text

```text
- **Blocked when:** not signed in, or the target item does not exist.
- **What changes:** the named fields are overwritten through the fgOS `edit`
  verb, which applies the same validation a terminal edit gets.
- **Side effects:** none beyond the item.
- **Afterwards:** the person sees the item's updated fields.
```

### Full target shown text

```text
- **Blocked when:** not signed in, or the target item does not exist.
- **What changes:** the named fields are overwritten through the fgOS `edit`
  verb, which applies the same validation a terminal edit gets.
- **Side effects:** none beyond the item.
- **Afterwards:** the person sees the item's updated fields.
```

## claim_4d256574d9d600433a7494bfed0048cb

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#retire-a-work-item; lines 161–161; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations"].
Target: docs/platform/herdr-web-dashboard/spec.md#retire-a-work-item; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations"].
Source digest: 0f289b671871480d5cd3f29770acb6242825365a44b07966e3631820348b49fe
Target digest: 0f289b671871480d5cd3f29770acb6242825365a44b07966e3631820348b49fe
Shown source SHA256: 24741c07ce8cd8d9c5eb3fd06488ae5f2944006a40cff88192a71d040d4a2e42
Shown target SHA256: 24741c07ce8cd8d9c5eb3fd06488ae5f2944006a40cff88192a71d040d4a2e42

### Complete proposed decision

```json
{
  "claimId": "claim_4d256574d9d600433a7494bfed0048cb",
  "sourceUnitDigest": "0f289b671871480d5cd3f29770acb6242825365a44b07966e3631820348b49fe",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "retire-a-work-item",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/herdr-web-dashboard.md#retire-a-work-item (source lines 161-161) is carried at docs/platform/herdr-web-dashboard/spec.md#retire-a-work-item (candidate lines 183-183). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "0f289b671871480d5cd3f29770acb6242825365a44b07966e3631820348b49fe",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Behaviors & Operations"
  ]
}
```

### Full source shown text

```text
### Retire a work item

- **Blocked when:** not signed in; or the item is in a state its own
  lifecycle rules will not retire from.
- **What changes:** the item is moved to the terminal "valid, but never going
  to be done" state, through the fgOS `move` verb.
- **Side effects:** the item leaves the open-work lists.
- **Afterwards:** the person sees it as retired. **This is retirement, not
  deletion, and the difference is not cosmetic** — fgOS exposes no delete
  operation at all, and its history is an append-only record, so nothing this
  surface offers can erase an item or its past. A person who asks to "delete"
  an item gets retirement, and the surface should say so in those words rather
  than implying the record is gone.
```

### Full target shown text

```text
### Retire a work item

- **Blocked when:** not signed in; or the item is in a state its own
  lifecycle rules will not retire from.
- **What changes:** the item is moved to the terminal "valid, but never going
  to be done" state, through the fgOS `move` verb.
- **Side effects:** the item leaves the open-work lists.
- **Afterwards:** the person sees it as retired. **This is retirement, not
  deletion, and the difference is not cosmetic** — fgOS exposes no delete
  operation at all, and its history is an append-only record, so nothing this
  surface offers can erase an item or its past. A person who asks to "delete"
  an item gets retirement, and the surface should say so in those words rather
  than implying the record is gone.
```

## claim_1b33df3ee3004adf514f1532e32002cc

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#unheaded-block-17; lines 163–173; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations","Retire a work item"].
Target: docs/platform/herdr-web-dashboard/spec.md#unheaded-block-19; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Behaviors & Operations","Retire a work item"].
Source digest: 9e0b0e9b88a3b25b9731259e1c31d18661c588da2987fc364957d480a2391dd6
Target digest: 9e0b0e9b88a3b25b9731259e1c31d18661c588da2987fc364957d480a2391dd6
Shown source SHA256: 9e0b0e9b88a3b25b9731259e1c31d18661c588da2987fc364957d480a2391dd6
Shown target SHA256: 9e0b0e9b88a3b25b9731259e1c31d18661c588da2987fc364957d480a2391dd6

### Complete proposed decision

```json
{
  "claimId": "claim_1b33df3ee3004adf514f1532e32002cc",
  "sourceUnitDigest": "9e0b0e9b88a3b25b9731259e1c31d18661c588da2987fc364957d480a2391dd6",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "unheaded-block-19",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/herdr-web-dashboard.md#unheaded-block-17 (source lines 163-173) is carried at docs/platform/herdr-web-dashboard/spec.md#unheaded-block-19 (candidate lines 185-195). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "9e0b0e9b88a3b25b9731259e1c31d18661c588da2987fc364957d480a2391dd6",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Behaviors & Operations",
    "Retire a work item"
  ]
}
```

### Full source shown text

```text
- **Blocked when:** not signed in; or the item is in a state its own
  lifecycle rules will not retire from.
- **What changes:** the item is moved to the terminal "valid, but never going
  to be done" state, through the fgOS `move` verb.
- **Side effects:** the item leaves the open-work lists.
- **Afterwards:** the person sees it as retired. **This is retirement, not
  deletion, and the difference is not cosmetic** — fgOS exposes no delete
  operation at all, and its history is an append-only record, so nothing this
  surface offers can erase an item or its past. A person who asks to "delete"
  an item gets retirement, and the surface should say so in those words rather
  than implying the record is gone.
```

### Full target shown text

```text
- **Blocked when:** not signed in; or the item is in a state its own
  lifecycle rules will not retire from.
- **What changes:** the item is moved to the terminal "valid, but never going
  to be done" state, through the fgOS `move` verb.
- **Side effects:** the item leaves the open-work lists.
- **Afterwards:** the person sees it as retired. **This is retirement, not
  deletion, and the difference is not cosmetic** — fgOS exposes no delete
  operation at all, and its history is an append-only record, so nothing this
  surface offers can erase an item or its past. A person who asks to "delete"
  an item gets retirement, and the surface should say so in those words rather
  than implying the record is gone.
```

## claim_55d0bc07e0c1c36016fcff043a0c492e

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#actors-access; lines 175–175; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)"].
Target: docs/platform/herdr-web-dashboard/spec.md#actors-access; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)"].
Source digest: c0f68bfbf42066278cf2e94e60e8919d9c54a16274952f3f46797c57d0d5dea1
Target digest: c0f68bfbf42066278cf2e94e60e8919d9c54a16274952f3f46797c57d0d5dea1
Shown source SHA256: 9f894823570b22e9c36a59efbfcc656ab4a31a0ca43c97b23f39cb407251fee5
Shown target SHA256: 9f894823570b22e9c36a59efbfcc656ab4a31a0ca43c97b23f39cb407251fee5

### Complete proposed decision

```json
{
  "claimId": "claim_55d0bc07e0c1c36016fcff043a0c492e",
  "sourceUnitDigest": "c0f68bfbf42066278cf2e94e60e8919d9c54a16274952f3f46797c57d0d5dea1",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "actors-access",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/herdr-web-dashboard.md#actors-access (source lines 175-175) is carried at docs/platform/herdr-web-dashboard/spec.md#actors-access (candidate lines 197-197). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "c0f68bfbf42066278cf2e94e60e8919d9c54a16274952f3f46797c57d0d5dea1",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)"
  ]
}
```

### Full source shown text

```text
## Actors & Access

| Capability | Holder of the machine's token |
|---|---|
| Read: taskboard, task detail, questions needing answer | ✓ |
| Write: answer a question, add, edit, retire an item | ✓ |
| Write: approve a merge (changes trunk) | ✓ |

**There is exactly one technical actor, and this table is the whole access
model.** That is a statement about what the system enforces, not about who is
expected to use it. Two consequences are worth naming plainly rather than
leaving a reader to discover them:

- **Product roles are not enforced roles.** "The product owner reviewing from
  a phone" is who this surface is *for*; it is not a role the system can tell
  apart from any other holder of the same credential.
- **There is no finer grain to reach for.** fgOS deliberately has no
  authorization layer — "who may call which verb" is a separate, unbuilt
  capability (`docs/io-contract.md` §Ranh giới, STR38) — and the gateway's own
  credential is one token covering the whole machine, not per project and not
  per person (one token per machine, per fgos-interface-daemon's auth decision). So read access and trunk-changing access are the
  same access. See Open Gaps.
```

### Full target shown text

```text
## Actors & Access

| Capability | Holder of the machine's token |
|---|---|
| Read: taskboard, task detail, questions needing answer | ✓ |
| Write: answer a question, add, edit, retire an item | ✓ |
| Write: approve a merge (changes trunk) | ✓ |

**There is exactly one technical actor, and this table is the whole access
model.** That is a statement about what the system enforces, not about who is
expected to use it. Two consequences are worth naming plainly rather than
leaving a reader to discover them:

- **Product roles are not enforced roles.** "The product owner reviewing from
  a phone" is who this surface is *for*; it is not a role the system can tell
  apart from any other holder of the same credential.
- **There is no finer grain to reach for.** fgOS deliberately has no
  authorization layer — "who may call which verb" is a separate, unbuilt
  capability (`docs/io-contract.md` §Ranh giới, STR38) — and the gateway's own
  credential is one token covering the whole machine, not per project and not
  per person (one token per machine, per fgos-interface-daemon's auth decision). So read access and trunk-changing access are the
  same access. See Open Gaps.
```

## claim_ea002bc3d8c38abf1f348cce4f96931e

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#unheaded-block-18; lines 177–181; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Actors & Access"].
Target: docs/platform/herdr-web-dashboard/spec.md#unheaded-block-20; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Actors & Access"].
Source digest: ab25ec2e78e6b621aef48959d5050681a09fcfcd9f0bb232c6e17fb089c3527a
Target digest: ab25ec2e78e6b621aef48959d5050681a09fcfcd9f0bb232c6e17fb089c3527a
Shown source SHA256: ab25ec2e78e6b621aef48959d5050681a09fcfcd9f0bb232c6e17fb089c3527a
Shown target SHA256: ab25ec2e78e6b621aef48959d5050681a09fcfcd9f0bb232c6e17fb089c3527a

### Complete proposed decision

```json
{
  "claimId": "claim_ea002bc3d8c38abf1f348cce4f96931e",
  "sourceUnitDigest": "ab25ec2e78e6b621aef48959d5050681a09fcfcd9f0bb232c6e17fb089c3527a",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "unheaded-block-20",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/herdr-web-dashboard.md#unheaded-block-18 (source lines 177-181) is carried at docs/platform/herdr-web-dashboard/spec.md#unheaded-block-20 (candidate lines 199-203). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "ab25ec2e78e6b621aef48959d5050681a09fcfcd9f0bb232c6e17fb089c3527a",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Actors & Access"
  ]
}
```

### Full source shown text

```text
| Capability | Holder of the machine's token |
|---|---|
| Read: taskboard, task detail, questions needing answer | ✓ |
| Write: answer a question, add, edit, retire an item | ✓ |
| Write: approve a merge (changes trunk) | ✓ |
```

### Full target shown text

```text
| Capability | Holder of the machine's token |
|---|---|
| Read: taskboard, task detail, questions needing answer | ✓ |
| Write: answer a question, add, edit, retire an item | ✓ |
| Write: approve a merge (changes trunk) | ✓ |
```

## claim_7b00d9d035bd97de226726944f711311

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#unheaded-block-19; lines 183–186; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Actors & Access"].
Target: docs/platform/herdr-web-dashboard/spec.md#unheaded-block-21; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Actors & Access"].
Source digest: 956aba0bd61a349e8e839c956ce22ee818fd15e47af10c447c34b9030859ad27
Target digest: 956aba0bd61a349e8e839c956ce22ee818fd15e47af10c447c34b9030859ad27
Shown source SHA256: 956aba0bd61a349e8e839c956ce22ee818fd15e47af10c447c34b9030859ad27
Shown target SHA256: 956aba0bd61a349e8e839c956ce22ee818fd15e47af10c447c34b9030859ad27

### Complete proposed decision

```json
{
  "claimId": "claim_7b00d9d035bd97de226726944f711311",
  "sourceUnitDigest": "956aba0bd61a349e8e839c956ce22ee818fd15e47af10c447c34b9030859ad27",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "unheaded-block-21",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/herdr-web-dashboard.md#unheaded-block-19 (source lines 183-186) is carried at docs/platform/herdr-web-dashboard/spec.md#unheaded-block-21 (candidate lines 205-208). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "956aba0bd61a349e8e839c956ce22ee818fd15e47af10c447c34b9030859ad27",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Actors & Access"
  ]
}
```

### Full source shown text

```text
**There is exactly one technical actor, and this table is the whole access
model.** That is a statement about what the system enforces, not about who is
expected to use it. Two consequences are worth naming plainly rather than
leaving a reader to discover them:
```

### Full target shown text

```text
**There is exactly one technical actor, and this table is the whole access
model.** That is a statement about what the system enforces, not about who is
expected to use it. Two consequences are worth naming plainly rather than
leaving a reader to discover them:
```

## claim_1522a44e0505b7aaed5d55bf4f2b1900

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#unheaded-block-20; lines 188–196; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Actors & Access"].
Target: docs/platform/herdr-web-dashboard/spec.md#unheaded-block-22; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Actors & Access"].
Source digest: b56dc220d011602cc15df733f86c367b9582332414162a6ca27b45ca34f09705
Target digest: b56dc220d011602cc15df733f86c367b9582332414162a6ca27b45ca34f09705
Shown source SHA256: b56dc220d011602cc15df733f86c367b9582332414162a6ca27b45ca34f09705
Shown target SHA256: b56dc220d011602cc15df733f86c367b9582332414162a6ca27b45ca34f09705

### Complete proposed decision

```json
{
  "claimId": "claim_1522a44e0505b7aaed5d55bf4f2b1900",
  "sourceUnitDigest": "b56dc220d011602cc15df733f86c367b9582332414162a6ca27b45ca34f09705",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "unheaded-block-22",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/herdr-web-dashboard.md#unheaded-block-20 (source lines 188-196) is carried at docs/platform/herdr-web-dashboard/spec.md#unheaded-block-22 (candidate lines 210-218). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "b56dc220d011602cc15df733f86c367b9582332414162a6ca27b45ca34f09705",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Actors & Access"
  ]
}
```

### Full source shown text

```text
- **Product roles are not enforced roles.** "The product owner reviewing from
  a phone" is who this surface is *for*; it is not a role the system can tell
  apart from any other holder of the same credential.
- **There is no finer grain to reach for.** fgOS deliberately has no
  authorization layer — "who may call which verb" is a separate, unbuilt
  capability (`docs/io-contract.md` §Ranh giới, STR38) — and the gateway's own
  credential is one token covering the whole machine, not per project and not
  per person (one token per machine, per fgos-interface-daemon's auth decision). So read access and trunk-changing access are the
  same access. See Open Gaps.
```

### Full target shown text

```text
- **Product roles are not enforced roles.** "The product owner reviewing from
  a phone" is who this surface is *for*; it is not a role the system can tell
  apart from any other holder of the same credential.
- **There is no finer grain to reach for.** fgOS deliberately has no
  authorization layer — "who may call which verb" is a separate, unbuilt
  capability (`docs/io-contract.md` §Ranh giới, STR38) — and the gateway's own
  credential is one token covering the whole machine, not per project and not
  per person (one token per machine, per fgos-interface-daemon's auth decision). So read access and trunk-changing access are the
  same access. See Open Gaps.
```

## claim_f41d47fdbe1875d4e57de8d2ecc6dcf7

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#business-rules; lines 198–198; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)"].
Target: docs/platform/herdr-web-dashboard/spec.md#business-rules; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)"].
Source digest: aa8a1d069167968c4413d8380b065b9c70db60827dcffc5551b0dd8f66240125
Target digest: aa8a1d069167968c4413d8380b065b9c70db60827dcffc5551b0dd8f66240125
Shown source SHA256: a63c657f220f4fac9ec51edba4f5e22cb7d84bdafd0b638f0aea22d96ef7f153
Shown target SHA256: a63c657f220f4fac9ec51edba4f5e22cb7d84bdafd0b638f0aea22d96ef7f153

### Complete proposed decision

```json
{
  "claimId": "claim_f41d47fdbe1875d4e57de8d2ecc6dcf7",
  "sourceUnitDigest": "aa8a1d069167968c4413d8380b065b9c70db60827dcffc5551b0dd8f66240125",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "business-rules",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/herdr-web-dashboard.md#business-rules (source lines 198-198) is carried at docs/platform/herdr-web-dashboard/spec.md#business-rules (candidate lines 220-220). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "aa8a1d069167968c4413d8380b065b9c70db60827dcffc5551b0dd8f66240125",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)"
  ]
}
```

### Full source shown text

```text
## Business Rules

- **R1.** The surface is a client of the gateway's API, never an embedded
  server inside the former combined binary (per fgos-interface-daemon's hexagonal-ports decision, decision `0014`). It is built to
  address more than one gateway, so no single fixed origin may be baked into
  it (per fgos-interface-daemon's per-machine-scope decision).
- **R2.** Every write goes through an fgOS one-door-write verb — `answer`
  (forwarding `--approve` when `approve: true`), `approve`, the intake verb, `edit`,
  `move` (forwarding `--approve` when `approve: true`) — executed by the gateway, which
  is the sole component that runs those verbs on a client's behalf (per fgos-interface-daemon — gateway is the sole chokepoint that ever spawns fgos verbs). The web surface never writes fgOS state directly. No second write path
  is introduced by anything in this spec.
- **R3.** A person may not read anything before signing in (mandatory token auth from v1). Sign-in is
  token-based, and every failure is indistinguishable from "nothing here"
  (an opaque 404, never 401). A second, alternative credential path exists in the design and, if
  used, must verify its assertion's signature properly rather than trusting a
  header (the two-layer additive auth design — cookie session plus an optional cf-access JWT that must be cryptographically verified, never trusted on the header alone).
- **R4.** The token is never stored anywhere that is committed. It comes from
  the environment when set; otherwise it is generated into a local file that
  is excluded from version control and readable only by its owner.
- **R5.** The surface is enabled by default (its own config toggle defaults ON, unlike other auto-launch toggles) and its default bind reaches
  beyond loopback (binds 0.0.0.0 by default, bind address configurable), with a warning raised when the bind is not loopback.
  Its port is 8788, chosen to coexist with the neighbouring service on 8787
  (its config section carries a port field, defaulting to 8788).
- **R6.** The dashboard's lifetime is independent of the cockpit's. Closing a
  cockpit pane does not stop it (it runs as a child process outliving the cockpit pane).
- **R7.** A merge approval can only be performed where fgOS allows it: the
  `approve` verb structurally refuses to run from a linked worktree and
  requires the repository's main working tree. This is a real mechanical
  constraint on the deployment, not a UI concern — a gateway positioned
  anywhere else cannot offer this operation at all, and the surface must
  report that honestly rather than appearing to offer it.
- **R8.** The combination of R5 (on by default, bind beyond loopback) and the
  write operations above means **the first run of the cockpit exposes a
  trunk-changing surface on the network, without anyone having chosen to**.
  The token (R3/R4) is therefore not a hardening layer that can be traded away
  for convenience — it is the only thing holding the surface closed. The
  product owner decided this default having been shown this exact consequence
  (rationale: `docs/history/herdr-web-dashboard/CONTEXT.md`'s own consequences section for the on-by-default decision), and the
  write operations added later raise its weight rather than changing the
  decision.
- **R9.** Questions and answers are paired positionally, by order of
  recording, with no linking key added to the underlying records — the record
  shape is deliberately unchanged.
- **R10.** The narrative written for humans is the primary account of what an
  agent did; the machine-side decision log is secondary detail.
- **R11.** Nothing on this surface pushes to a person. Being informed is a
  pull: the person opens the dashboard and looks.
```

### Full target shown text

```text
## Business Rules

- **R1.** The surface is a client of the gateway's API, never an embedded
  server inside the former combined binary (per fgos-interface-daemon's hexagonal-ports decision, decision `0014`). It is built to
  address more than one gateway, so no single fixed origin may be baked into
  it (per fgos-interface-daemon's per-machine-scope decision).
- **R2.** Every write goes through an fgOS one-door-write verb — `answer`
  (forwarding `--approve` when `approve: true`), `approve`, the intake verb, `edit`,
  `move` (forwarding `--approve` when `approve: true`) — executed by the gateway, which
  is the sole component that runs those verbs on a client's behalf (per fgos-interface-daemon — gateway is the sole chokepoint that ever spawns fgos verbs). The web surface never writes fgOS state directly. No second write path
  is introduced by anything in this spec.
- **R3.** A person may not read anything before signing in (mandatory token auth from v1). Sign-in is
  token-based, and every failure is indistinguishable from "nothing here"
  (an opaque 404, never 401). A second, alternative credential path exists in the design and, if
  used, must verify its assertion's signature properly rather than trusting a
  header (the two-layer additive auth design — cookie session plus an optional cf-access JWT that must be cryptographically verified, never trusted on the header alone).
- **R4.** The token is never stored anywhere that is committed. It comes from
  the environment when set; otherwise it is generated into a local file that
  is excluded from version control and readable only by its owner.
- **R5.** The surface is enabled by default (its own config toggle defaults ON, unlike other auto-launch toggles) and its default bind reaches
  beyond loopback (binds 0.0.0.0 by default, bind address configurable), with a warning raised when the bind is not loopback.
  Its port is 8788, chosen to coexist with the neighbouring service on 8787
  (its config section carries a port field, defaulting to 8788).
- **R6.** The dashboard's lifetime is independent of the cockpit's. Closing a
  cockpit pane does not stop it (it runs as a child process outliving the cockpit pane).
- **R7.** A merge approval can only be performed where fgOS allows it: the
  `approve` verb structurally refuses to run from a linked worktree and
  requires the repository's main working tree. This is a real mechanical
  constraint on the deployment, not a UI concern — a gateway positioned
  anywhere else cannot offer this operation at all, and the surface must
  report that honestly rather than appearing to offer it.
- **R8.** The combination of R5 (on by default, bind beyond loopback) and the
  write operations above means **the first run of the cockpit exposes a
  trunk-changing surface on the network, without anyone having chosen to**.
  The token (R3/R4) is therefore not a hardening layer that can be traded away
  for convenience — it is the only thing holding the surface closed. The
  product owner decided this default having been shown this exact consequence
  (rationale: `docs/history/herdr-web-dashboard/CONTEXT.md`'s own consequences section for the on-by-default decision), and the
  write operations added later raise its weight rather than changing the
  decision.
- **R9.** Questions and answers are paired positionally, by order of
  recording, with no linking key added to the underlying records — the record
  shape is deliberately unchanged.
- **R10.** The narrative written for humans is the primary account of what an
  agent did; the machine-side decision log is secondary detail.
- **R11.** Nothing on this surface pushes to a person. Being informed is a
  pull: the person opens the dashboard and looks.
```
