# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-herdr-web-dashboard-01.json
Shard SHA256: 754c1e315b8b924b70e4d1d25e8be74e8c70574e9e398dc069d2e6d64746d141
Source: docs/specs/herdr-web-dashboard.md
Part 2/2; entries: **9**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 4/4 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_45115f693318a55ed50c43db83c97baa",
      "claim_878e9f5faa08a2977408f49e04af0a7a",
      "claim_83dd4d99cd52076452282b5565b0ea22",
      "claim_dc3d0ae980bf2501bc8eabfa0484a46d",
      "claim_69691b25b6d84c05b566346866ec6c83"
    ],
    "Weak-exact": [
      "claim_7e17ce226062d06a53b940f64b9d5cdb",
      "claim_2aae8d6820a6ad622e47c07d29c428bf",
      "claim_b2e9e87b9980819fad263ba9c6b02b33",
      "claim_28bc1b3d26ce9cf45d2477c1d69d181d"
    ],
    "Judgment": []
  },
  "unequalDigestPairs": [],
  "noTargetGeneratedRows": [],
  "mandatoryDeep": []
}
```


Return Reviewer, Author session(s), Review mode: ordinary, immutable content/request/shard pins, and one row per claim. Use ok/rework/hold, an own note prefixed deep or mechanical, full 64-hex digests; literal none for absent target. Consolidate parts by original shard before applying.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|


## claim_45115f693318a55ed50c43db83c97baa

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#unheaded-block-21; lines 200–244; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Business Rules"].
Target: docs/platform/herdr-web-dashboard/spec.md#unheaded-block-23; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Business Rules"].
Source digest: 7d9e2d425937e495926bbff08bacc8e77e9781253b5c83692215e62cf6da2913
Target digest: 7d9e2d425937e495926bbff08bacc8e77e9781253b5c83692215e62cf6da2913
Shown source SHA256: 7d9e2d425937e495926bbff08bacc8e77e9781253b5c83692215e62cf6da2913
Shown target SHA256: 7d9e2d425937e495926bbff08bacc8e77e9781253b5c83692215e62cf6da2913

### Complete proposed decision

```json
{
  "claimId": "claim_45115f693318a55ed50c43db83c97baa",
  "sourceUnitDigest": "7d9e2d425937e495926bbff08bacc8e77e9781253b5c83692215e62cf6da2913",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "unheaded-block-23",
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/herdr-web-dashboard.md#unheaded-block-21 (source lines 200-244) is carried at docs/platform/herdr-web-dashboard/spec.md#unheaded-block-23 (candidate lines 222-266). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "7d9e2d425937e495926bbff08bacc8e77e9781253b5c83692215e62cf6da2913",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Business Rules"
  ]
}
```

### Full source shown text

```text
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

## claim_7e17ce226062d06a53b940f64b9d5cdb

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#edge-cases-settled; lines 246–246; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)"].
Target: docs/platform/herdr-web-dashboard/spec.md#edge-cases-settled; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)"].
Source digest: e57fadfa3c6367e1098e0565fa3a61fe011bb34b4994eb241557beaa2c2ff879
Target digest: e57fadfa3c6367e1098e0565fa3a61fe011bb34b4994eb241557beaa2c2ff879
Shown source SHA256: 2c7e244c62920cfd29988bbd891d89a1841b3d1987b3bbb6636862cbcf56d327
Shown target SHA256: 2c7e244c62920cfd29988bbd891d89a1841b3d1987b3bbb6636862cbcf56d327

### Complete proposed decision

```json
{
  "claimId": "claim_7e17ce226062d06a53b940f64b9d5cdb",
  "sourceUnitDigest": "e57fadfa3c6367e1098e0565fa3a61fe011bb34b4994eb241557beaa2c2ff879",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "edge-cases-settled",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/herdr-web-dashboard.md#edge-cases-settled (source lines 246-246) is carried at docs/platform/herdr-web-dashboard/spec.md#edge-cases-settled (candidate lines 268-268). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "e57fadfa3c6367e1098e0565fa3a61fe011bb34b4994eb241557beaa2c2ff879",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)"
  ]
}
```

### Full source shown text

```text
## Edge Cases Settled

- **An item that has never been parked.** Its task detail shows a work history
  and an empty question/answer timeline — the empty timeline is the normal
  case, not an error.
- **An item whose narrative source is missing.** Its documentation reference
  can point at a directory that does not exist. The detail screen shows the
  item without its narrative rather than failing; the missing narrative is
  reported as missing.
- **A narrative reference pointing outside the documentation tree.** Treated
  as invalid and refused, not followed.
- **The cockpit is closed.** The dashboard keeps serving (R6) — this is
  the whole point of the design, not a leftover process.
- **The gateway is unreachable.** The client says so plainly and offers to
  retry; it never presents stale data as current.
- **Approve is offered where it cannot run.** Covered by R7 — reported as
  unavailable with the reason, never attempted and silently failed.
- **Retire is asked for as "delete".** Covered under Retire a work item —
  the surface performs retirement and names it as such.
```

### Full target shown text

```text
## Edge Cases Settled

- **An item that has never been parked.** Its task detail shows a work history
  and an empty question/answer timeline — the empty timeline is the normal
  case, not an error.
- **An item whose narrative source is missing.** Its documentation reference
  can point at a directory that does not exist. The detail screen shows the
  item without its narrative rather than failing; the missing narrative is
  reported as missing.
- **A narrative reference pointing outside the documentation tree.** Treated
  as invalid and refused, not followed.
- **The cockpit is closed.** The dashboard keeps serving (R6) — this is
  the whole point of the design, not a leftover process.
- **The gateway is unreachable.** The client says so plainly and offers to
  retry; it never presents stale data as current.
- **Approve is offered where it cannot run.** Covered by R7 — reported as
  unavailable with the reason, never attempted and silently failed.
- **Retire is asked for as "delete".** Covered under Retire a work item —
  the surface performs retirement and names it as such.
```

## claim_878e9f5faa08a2977408f49e04af0a7a

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#unheaded-block-22; lines 248–264; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Edge Cases Settled"].
Target: docs/platform/herdr-web-dashboard/spec.md#unheaded-block-24; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Edge Cases Settled"].
Source digest: 1c226a16285c1c611d2dcbc3db679c21f6367eb19f66428f97fa0b6741c2027d
Target digest: 1c226a16285c1c611d2dcbc3db679c21f6367eb19f66428f97fa0b6741c2027d
Shown source SHA256: 1c226a16285c1c611d2dcbc3db679c21f6367eb19f66428f97fa0b6741c2027d
Shown target SHA256: 1c226a16285c1c611d2dcbc3db679c21f6367eb19f66428f97fa0b6741c2027d

### Complete proposed decision

```json
{
  "claimId": "claim_878e9f5faa08a2977408f49e04af0a7a",
  "sourceUnitDigest": "1c226a16285c1c611d2dcbc3db679c21f6367eb19f66428f97fa0b6741c2027d",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "unheaded-block-24",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/herdr-web-dashboard.md#unheaded-block-22 (source lines 248-264) is carried at docs/platform/herdr-web-dashboard/spec.md#unheaded-block-24 (candidate lines 270-286). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "1c226a16285c1c611d2dcbc3db679c21f6367eb19f66428f97fa0b6741c2027d",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Edge Cases Settled"
  ]
}
```

### Full source shown text

```text
- **An item that has never been parked.** Its task detail shows a work history
  and an empty question/answer timeline — the empty timeline is the normal
  case, not an error.
- **An item whose narrative source is missing.** Its documentation reference
  can point at a directory that does not exist. The detail screen shows the
  item without its narrative rather than failing; the missing narrative is
  reported as missing.
- **A narrative reference pointing outside the documentation tree.** Treated
  as invalid and refused, not followed.
- **The cockpit is closed.** The dashboard keeps serving (R6) — this is
  the whole point of the design, not a leftover process.
- **The gateway is unreachable.** The client says so plainly and offers to
  retry; it never presents stale data as current.
- **Approve is offered where it cannot run.** Covered by R7 — reported as
  unavailable with the reason, never attempted and silently failed.
- **Retire is asked for as "delete".** Covered under Retire a work item —
  the surface performs retirement and names it as such.
```

### Full target shown text

```text
- **An item that has never been parked.** Its task detail shows a work history
  and an empty question/answer timeline — the empty timeline is the normal
  case, not an error.
- **An item whose narrative source is missing.** Its documentation reference
  can point at a directory that does not exist. The detail screen shows the
  item without its narrative rather than failing; the missing narrative is
  reported as missing.
- **A narrative reference pointing outside the documentation tree.** Treated
  as invalid and refused, not followed.
- **The cockpit is closed.** The dashboard keeps serving (R6) — this is
  the whole point of the design, not a leftover process.
- **The gateway is unreachable.** The client says so plainly and offers to
  retry; it never presents stale data as current.
- **Approve is offered where it cannot run.** Covered by R7 — reported as
  unavailable with the reason, never attempted and silently failed.
- **Retire is asked for as "delete".** Covered under Retire a work item —
  the surface performs retirement and names it as such.
```

## claim_2aae8d6820a6ad622e47c07d29c428bf

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#open-gaps; lines 266–266; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)"].
Target: docs/platform/herdr-web-dashboard/spec.md#open-gaps; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)"].
Source digest: 7eb0dd6b83a72e530a30575cbf43286ab809b83fba028d19ff465496a540375f
Target digest: 7eb0dd6b83a72e530a30575cbf43286ab809b83fba028d19ff465496a540375f
Shown source SHA256: 1ece889807229c38cd0125391d338c2e31bc18ee64a80a6077f6408ad530af52
Shown target SHA256: 1ece889807229c38cd0125391d338c2e31bc18ee64a80a6077f6408ad530af52

### Complete proposed decision

```json
{
  "claimId": "claim_2aae8d6820a6ad622e47c07d29c428bf",
  "sourceUnitDigest": "7eb0dd6b83a72e530a30575cbf43286ab809b83fba028d19ff465496a540375f",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "open-gaps",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/herdr-web-dashboard.md#open-gaps (source lines 266-266) is carried at docs/platform/herdr-web-dashboard/spec.md#open-gaps (candidate lines 288-288). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "7eb0dd6b83a72e530a30575cbf43286ab809b83fba028d19ff465496a540375f",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)"
  ]
}
```

### Full source shown text

```text
## Open Gaps

- **Authorization granularity for write actions — unresolved, and it is the
  significant one.** Everything under Behaviors & Operations that writes, and
  `approve` above all, is available to whoever holds the machine's single
  token. There is no per-person, per-project, or per-verb distinction to
  spec against, because neither fgOS nor the gateway has one (STR38 unbuilt;
  fgos-interface-daemon's own one-token-per-machine decision does not add one). The exposure is stated rather than mitigated. Closing this
  needs its own item and its own decision — the authorization layer's own
  scope, not this spec's, and not something to be improvised inside the web
  client.
- **The gateway's own API contract now exists** —
  `docs/contracts/fgos-gateway-api-v1.yaml`, landed by tsk-7l9, carrying 18
  paths that match `apps/fgos-gateway/src/gateway.rs`'s registered routes 1-to-1.
  This spec still describes operations in product terms rather than
  restating endpoint shapes, but that contract — not this prose — is the
  boundary's source of truth, and any surface built against it cites it
  directly. Two facts from it constrain this spec's own surfaces and are
  recorded here rather than left to be rediscovered: there is **no edit
  route** (`/work/{id}` is `get` only), so M03's edit mode depends on a
  route that has to be added first; and there is **no SSE or WebSocket**,
  only a `GET /state/digest` cheap poll, which is why `15-system-events.md`
  describes client-derived events rather than server-pushed ones.
- **Multi-project and multi-endpoint behaviour is only half-decided.** The
  client must not assume one fixed gateway (fgos-interface-daemon's per-machine-scope decision, R1), but how a person
  chooses between projects and instances, and how the surface shows which one
  they are looking at, is deferred to `tsk-3b0` (multi-project port/identity handling is deferred there).
- **No attention channel.** R11 records that nothing notifies a person. Whether
  it should is a separate, unbuilt capability (STR48).
- **Coverage is `partial` on purpose.** The three read screens are locked by
  fourteen decisions; the six write operations were added later, outside that
  discussion, and are settled here only as far as existing mechanisms and the
  product owner's decisions at this item's own gate allow.
```

### Full target shown text

```text
## Open Gaps

- **Authorization granularity for write actions — unresolved, and it is the
  significant one.** Everything under Behaviors & Operations that writes, and
  `approve` above all, is available to whoever holds the machine's single
  token. There is no per-person, per-project, or per-verb distinction to
  spec against, because neither fgOS nor the gateway has one (STR38 unbuilt;
  fgos-interface-daemon's own one-token-per-machine decision does not add one). The exposure is stated rather than mitigated. Closing this
  needs its own item and its own decision — the authorization layer's own
  scope, not this spec's, and not something to be improvised inside the web
  client.
- **The gateway's own API contract now exists** —
  `docs/contracts/fgos-gateway-api-v1.yaml`, landed by tsk-7l9, carrying 18
  paths that match `apps/fgos-gateway/src/gateway.rs`'s registered routes 1-to-1.
  This spec still describes operations in product terms rather than
  restating endpoint shapes, but that contract — not this prose — is the
  boundary's source of truth, and any surface built against it cites it
  directly. Two facts from it constrain this spec's own surfaces and are
  recorded here rather than left to be rediscovered: there is **no edit
  route** (`/work/{id}` is `get` only), so M03's edit mode depends on a
  route that has to be added first; and there is **no SSE or WebSocket**,
  only a `GET /state/digest` cheap poll, which is why `15-system-events.md`
  describes client-derived events rather than server-pushed ones.
- **Multi-project and multi-endpoint behaviour is only half-decided.** The
  client must not assume one fixed gateway (fgos-interface-daemon's per-machine-scope decision, R1), but how a person
  chooses between projects and instances, and how the surface shows which one
  they are looking at, is deferred to `tsk-3b0` (multi-project port/identity handling is deferred there).
- **No attention channel.** R11 records that nothing notifies a person. Whether
  it should is a separate, unbuilt capability (STR48).
- **Coverage is `partial` on purpose.** The three read screens are locked by
  fourteen decisions; the six write operations were added later, outside that
  discussion, and are settled here only as far as existing mechanisms and the
  product owner's decisions at this item's own gate allow.
```

## claim_83dd4d99cd52076452282b5565b0ea22

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#unheaded-block-23; lines 268–298; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Open Gaps"].
Target: docs/platform/herdr-web-dashboard/spec.md#unheaded-block-25; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Open Gaps"].
Source digest: ef410a08c708a2f590fd777deb282577a8712b80ca1eee9522247534cc06ad99
Target digest: ef410a08c708a2f590fd777deb282577a8712b80ca1eee9522247534cc06ad99
Shown source SHA256: ef410a08c708a2f590fd777deb282577a8712b80ca1eee9522247534cc06ad99
Shown target SHA256: ef410a08c708a2f590fd777deb282577a8712b80ca1eee9522247534cc06ad99

### Complete proposed decision

```json
{
  "claimId": "claim_83dd4d99cd52076452282b5565b0ea22",
  "sourceUnitDigest": "ef410a08c708a2f590fd777deb282577a8712b80ca1eee9522247534cc06ad99",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "unheaded-block-25",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/herdr-web-dashboard.md#unheaded-block-23 (source lines 268-298) is carried at docs/platform/herdr-web-dashboard/spec.md#unheaded-block-25 (candidate lines 290-320). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "ef410a08c708a2f590fd777deb282577a8712b80ca1eee9522247534cc06ad99",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Open Gaps"
  ]
}
```

### Full source shown text

```text
- **Authorization granularity for write actions — unresolved, and it is the
  significant one.** Everything under Behaviors & Operations that writes, and
  `approve` above all, is available to whoever holds the machine's single
  token. There is no per-person, per-project, or per-verb distinction to
  spec against, because neither fgOS nor the gateway has one (STR38 unbuilt;
  fgos-interface-daemon's own one-token-per-machine decision does not add one). The exposure is stated rather than mitigated. Closing this
  needs its own item and its own decision — the authorization layer's own
  scope, not this spec's, and not something to be improvised inside the web
  client.
- **The gateway's own API contract now exists** —
  `docs/contracts/fgos-gateway-api-v1.yaml`, landed by tsk-7l9, carrying 18
  paths that match `apps/fgos-gateway/src/gateway.rs`'s registered routes 1-to-1.
  This spec still describes operations in product terms rather than
  restating endpoint shapes, but that contract — not this prose — is the
  boundary's source of truth, and any surface built against it cites it
  directly. Two facts from it constrain this spec's own surfaces and are
  recorded here rather than left to be rediscovered: there is **no edit
  route** (`/work/{id}` is `get` only), so M03's edit mode depends on a
  route that has to be added first; and there is **no SSE or WebSocket**,
  only a `GET /state/digest` cheap poll, which is why `15-system-events.md`
  describes client-derived events rather than server-pushed ones.
- **Multi-project and multi-endpoint behaviour is only half-decided.** The
  client must not assume one fixed gateway (fgos-interface-daemon's per-machine-scope decision, R1), but how a person
  chooses between projects and instances, and how the surface shows which one
  they are looking at, is deferred to `tsk-3b0` (multi-project port/identity handling is deferred there).
- **No attention channel.** R11 records that nothing notifies a person. Whether
  it should is a separate, unbuilt capability (STR48).
- **Coverage is `partial` on purpose.** The three read screens are locked by
  fourteen decisions; the six write operations were added later, outside that
  discussion, and are settled here only as far as existing mechanisms and the
  product owner's decisions at this item's own gate allow.
```

### Full target shown text

```text
- **Authorization granularity for write actions — unresolved, and it is the
  significant one.** Everything under Behaviors & Operations that writes, and
  `approve` above all, is available to whoever holds the machine's single
  token. There is no per-person, per-project, or per-verb distinction to
  spec against, because neither fgOS nor the gateway has one (STR38 unbuilt;
  fgos-interface-daemon's own one-token-per-machine decision does not add one). The exposure is stated rather than mitigated. Closing this
  needs its own item and its own decision — the authorization layer's own
  scope, not this spec's, and not something to be improvised inside the web
  client.
- **The gateway's own API contract now exists** —
  `docs/contracts/fgos-gateway-api-v1.yaml`, landed by tsk-7l9, carrying 18
  paths that match `apps/fgos-gateway/src/gateway.rs`'s registered routes 1-to-1.
  This spec still describes operations in product terms rather than
  restating endpoint shapes, but that contract — not this prose — is the
  boundary's source of truth, and any surface built against it cites it
  directly. Two facts from it constrain this spec's own surfaces and are
  recorded here rather than left to be rediscovered: there is **no edit
  route** (`/work/{id}` is `get` only), so M03's edit mode depends on a
  route that has to be added first; and there is **no SSE or WebSocket**,
  only a `GET /state/digest` cheap poll, which is why `15-system-events.md`
  describes client-derived events rather than server-pushed ones.
- **Multi-project and multi-endpoint behaviour is only half-decided.** The
  client must not assume one fixed gateway (fgos-interface-daemon's per-machine-scope decision, R1), but how a person
  chooses between projects and instances, and how the surface shows which one
  they are looking at, is deferred to `tsk-3b0` (multi-project port/identity handling is deferred there).
- **No attention channel.** R11 records that nothing notifies a person. Whether
  it should is a separate, unbuilt capability (STR48).
- **Coverage is `partial` on purpose.** The three read screens are locked by
  fourteen decisions; the six write operations were added later, outside that
  discussion, and are settled here only as far as existing mechanisms and the
  product owner's decisions at this item's own gate allow.
```

## claim_b2e9e87b9980819fad263ba9c6b02b33

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#visuals; lines 300–300; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)"].
Target: docs/platform/herdr-web-dashboard/spec.md#visuals; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)"].
Source digest: 437a511cf26520d71ce066d992c8affdc6c87a686d737c2e54f748e640ee1b6a
Target digest: 437a511cf26520d71ce066d992c8affdc6c87a686d737c2e54f748e640ee1b6a
Shown source SHA256: 1b4ef1be0e38571c039e70a5533e10c9d8f15be3d42a4676ce09bcd2d64d9171
Shown target SHA256: 1b4ef1be0e38571c039e70a5533e10c9d8f15be3d42a4676ce09bcd2d64d9171

### Complete proposed decision

```json
{
  "claimId": "claim_b2e9e87b9980819fad263ba9c6b02b33",
  "sourceUnitDigest": "437a511cf26520d71ce066d992c8affdc6c87a686d737c2e54f748e640ee1b6a",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "visuals",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/herdr-web-dashboard.md#visuals (source lines 300-300) is carried at docs/platform/herdr-web-dashboard/spec.md#visuals (candidate lines 322-322). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "437a511cf26520d71ce066d992c8affdc6c87a686d737c2e54f748e640ee1b6a",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)"
  ]
}
```

### Full source shown text

```text
## Visuals

Not specified here by design. The concrete layout, userflow, empty/error
presentation, colour and typography are `tsk-3x6`'s deliverable:
`docs/reference/herdr-web-dashboard-layout.md`, which takes this spec as its
product input. The one direction this spec pins is the actor-facing
expectation recorded under "View the taskboard": a Monday.com/ClickUp-style
grouped board with in-place quick actions and filtering, not a flat table.
```

### Full target shown text

```text
## Visuals

Not specified here by design. The concrete layout, userflow, empty/error
presentation, colour and typography are `tsk-3x6`'s deliverable:
`docs/reference/herdr-web-dashboard-layout.md`, which takes this spec as its
product input. The one direction this spec pins is the actor-facing
expectation recorded under "View the taskboard": a Monday.com/ClickUp-style
grouped board with in-place quick actions and filtering, not a flat table.
```

## claim_dc3d0ae980bf2501bc8eabfa0484a46d

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#unheaded-block-24; lines 302–307; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Visuals"].
Target: docs/platform/herdr-web-dashboard/spec.md#unheaded-block-26; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Visuals"].
Source digest: b3f1a4dd83b0ff718a816b9eb068e4c5521f1d4ee30919d3ad097e62f4d16512
Target digest: b3f1a4dd83b0ff718a816b9eb068e4c5521f1d4ee30919d3ad097e62f4d16512
Shown source SHA256: b3f1a4dd83b0ff718a816b9eb068e4c5521f1d4ee30919d3ad097e62f4d16512
Shown target SHA256: b3f1a4dd83b0ff718a816b9eb068e4c5521f1d4ee30919d3ad097e62f4d16512

### Complete proposed decision

```json
{
  "claimId": "claim_dc3d0ae980bf2501bc8eabfa0484a46d",
  "sourceUnitDigest": "b3f1a4dd83b0ff718a816b9eb068e4c5521f1d4ee30919d3ad097e62f4d16512",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "unheaded-block-26",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/herdr-web-dashboard.md#unheaded-block-24 (source lines 302-307) is carried at docs/platform/herdr-web-dashboard/spec.md#unheaded-block-26 (candidate lines 324-329). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "b3f1a4dd83b0ff718a816b9eb068e4c5521f1d4ee30919d3ad097e62f4d16512",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Visuals"
  ]
}
```

### Full source shown text

```text
Not specified here by design. The concrete layout, userflow, empty/error
presentation, colour and typography are `tsk-3x6`'s deliverable:
`docs/reference/herdr-web-dashboard-layout.md`, which takes this spec as its
product input. The one direction this spec pins is the actor-facing
expectation recorded under "View the taskboard": a Monday.com/ClickUp-style
grouped board with in-place quick actions and filtering, not a flat table.
```

### Full target shown text

```text
Not specified here by design. The concrete layout, userflow, empty/error
presentation, colour and typography are `tsk-3x6`'s deliverable:
`docs/reference/herdr-web-dashboard-layout.md`, which takes this spec as its
product input. The one direction this spec pins is the actor-facing
expectation recorded under "View the taskboard": a Monday.com/ClickUp-style
grouped board with in-place quick actions and filtering, not a flat table.
```

## claim_28bc1b3d26ce9cf45d2477c1d69d181d

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#pointers-implementation; lines 309–309; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)"].
Target: docs/platform/herdr-web-dashboard/spec.md#pointers-implementation; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)"].
Source digest: 89f24a77c23b2d756b009fe0082bcf8b38734023875f1b84869980e67e1ed580
Target digest: 89f24a77c23b2d756b009fe0082bcf8b38734023875f1b84869980e67e1ed580
Shown source SHA256: 0ed43346e85b6336c57c9d63acb704ced1cc8f2f5663ecb03304159abb16f0fa
Shown target SHA256: 0ed43346e85b6336c57c9d63acb704ced1cc8f2f5663ecb03304159abb16f0fa

### Complete proposed decision

```json
{
  "claimId": "claim_28bc1b3d26ce9cf45d2477c1d69d181d",
  "sourceUnitDigest": "89f24a77c23b2d756b009fe0082bcf8b38734023875f1b84869980e67e1ed580",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "pointers-implementation",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/herdr-web-dashboard.md#pointers-implementation (source lines 309-309) is carried at docs/platform/herdr-web-dashboard/spec.md#pointers-implementation (candidate lines 331-331). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "89f24a77c23b2d756b009fe0082bcf8b38734023875f1b84869980e67e1ed580",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)"
  ]
}
```

### Full source shown text

```text
## Pointers (implementation)

- `docs/history/herdr-web-dashboard/CONTEXT.md` — the fourteen locked
  decisions this spec cites throughout, plus the scout evidence
  behind them.
- `docs/history/herdr-web-dashboard/DISCUSSION.md` — the five discussion
  rounds those decisions came out of.
- `docs/history/herdr-web-dashboard/plan.md` — the build shape: five pieces
  (config/doctor, server core and sign-in, taskboard, task detail, alternative
  credential path), plus this spec's own planning section.
- `docs/history/fgos-interface-daemon/CONTEXT.md` — the gateway's own locked
  decisions, in particular per-machine scope (multi-endpoint clients),
  one token per machine, gateway is the sole runner of fgOS verbs,
  where gateway lives (that web is an independent client), and the API
  contract still to be written.
- `docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` — why a non-terminal
  UI is a client of a network gate rather than its own server.
- `docs/io-contract.md` — the CLI's in/out contract, and the explicit boundary
  saying the authorization layer (STR38) and the attention channel (STR48) are
  outside it.
- `docs/specs/work-state.md` — the lifecycle meaning behind every status,
  stage, question and answer this surface displays.
- `docs/reference/herdr-web-dashboard-layout.md` — the UI layer (`tsk-3x6`).
```

### Full target shown text

```text
## Pointers (implementation)

- `docs/history/herdr-web-dashboard/CONTEXT.md` — the fourteen locked
  decisions this spec cites throughout, plus the scout evidence
  behind them.
- `docs/history/herdr-web-dashboard/DISCUSSION.md` — the five discussion
  rounds those decisions came out of.
- `docs/history/herdr-web-dashboard/plan.md` — the build shape: five pieces
  (config/doctor, server core and sign-in, taskboard, task detail, alternative
  credential path), plus this spec's own planning section.
- `docs/history/fgos-interface-daemon/CONTEXT.md` — the gateway's own locked
  decisions, in particular per-machine scope (multi-endpoint clients),
  one token per machine, gateway is the sole runner of fgOS verbs,
  where gateway lives (that web is an independent client), and the API
  contract still to be written.
- `docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` — why a non-terminal
  UI is a client of a network gate rather than its own server.
- `docs/io-contract.md` — the CLI's in/out contract, and the explicit boundary
  saying the authorization layer (STR38) and the attention channel (STR48) are
  outside it.
- `docs/specs/work-state.md` — the lifecycle meaning behind every status,
  stage, question and answer this surface displays.
- `docs/reference/herdr-web-dashboard-layout.md` — the UI layer (`tsk-3x6`).
```

## claim_69691b25b6d84c05b566346866ec6c83

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/herdr-web-dashboard.md#unheaded-block-25; lines 311–331; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Pointers (implementation)"].
Target: docs/platform/herdr-web-dashboard/spec.md#unheaded-block-27; ancestry ["Spec: herdr Web Dashboard (browser surface for fgOS work)","Pointers (implementation)"].
Source digest: b0d3ed0823c5a6e58fc870563461d32c3ce61fd9745b78444276500e7135addb
Target digest: b0d3ed0823c5a6e58fc870563461d32c3ce61fd9745b78444276500e7135addb
Shown source SHA256: b0d3ed0823c5a6e58fc870563461d32c3ce61fd9745b78444276500e7135addb
Shown target SHA256: b0d3ed0823c5a6e58fc870563461d32c3ce61fd9745b78444276500e7135addb

### Complete proposed decision

```json
{
  "claimId": "claim_69691b25b6d84c05b566346866ec6c83",
  "sourceUnitDigest": "b0d3ed0823c5a6e58fc870563461d32c3ce61fd9745b78444276500e7135addb",
  "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
  "targetAnchor": "unheaded-block-27",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/herdr-web-dashboard.md#unheaded-block-25 (source lines 311-331) is carried at docs/platform/herdr-web-dashboard/spec.md#unheaded-block-27 (candidate lines 333-353). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/herdr-web-dashboard.md verbatim in docs/platform/herdr-web-dashboard/spec.md. Map kind spec is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "b0d3ed0823c5a6e58fc870563461d32c3ce61fd9745b78444276500e7135addb",
  "targetAncestry": [
    "Spec: herdr Web Dashboard (browser surface for fgOS work)",
    "Pointers (implementation)"
  ]
}
```

### Full source shown text

```text
- `docs/history/herdr-web-dashboard/CONTEXT.md` — the fourteen locked
  decisions this spec cites throughout, plus the scout evidence
  behind them.
- `docs/history/herdr-web-dashboard/DISCUSSION.md` — the five discussion
  rounds those decisions came out of.
- `docs/history/herdr-web-dashboard/plan.md` — the build shape: five pieces
  (config/doctor, server core and sign-in, taskboard, task detail, alternative
  credential path), plus this spec's own planning section.
- `docs/history/fgos-interface-daemon/CONTEXT.md` — the gateway's own locked
  decisions, in particular per-machine scope (multi-endpoint clients),
  one token per machine, gateway is the sole runner of fgOS verbs,
  where gateway lives (that web is an independent client), and the API
  contract still to be written.
- `docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` — why a non-terminal
  UI is a client of a network gate rather than its own server.
- `docs/io-contract.md` — the CLI's in/out contract, and the explicit boundary
  saying the authorization layer (STR38) and the attention channel (STR48) are
  outside it.
- `docs/specs/work-state.md` — the lifecycle meaning behind every status,
  stage, question and answer this surface displays.
- `docs/reference/herdr-web-dashboard-layout.md` — the UI layer (`tsk-3x6`).
```

### Full target shown text

```text
- `docs/history/herdr-web-dashboard/CONTEXT.md` — the fourteen locked
  decisions this spec cites throughout, plus the scout evidence
  behind them.
- `docs/history/herdr-web-dashboard/DISCUSSION.md` — the five discussion
  rounds those decisions came out of.
- `docs/history/herdr-web-dashboard/plan.md` — the build shape: five pieces
  (config/doctor, server core and sign-in, taskboard, task detail, alternative
  credential path), plus this spec's own planning section.
- `docs/history/fgos-interface-daemon/CONTEXT.md` — the gateway's own locked
  decisions, in particular per-machine scope (multi-endpoint clients),
  one token per machine, gateway is the sole runner of fgOS verbs,
  where gateway lives (that web is an independent client), and the API
  contract still to be written.
- `docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` — why a non-terminal
  UI is a client of a network gate rather than its own server.
- `docs/io-contract.md` — the CLI's in/out contract, and the explicit boundary
  saying the authorization layer (STR38) and the attention channel (STR48) are
  outside it.
- `docs/specs/work-state.md` — the lifecycle meaning behind every status,
  stage, question and answer this surface displays.
- `docs/reference/herdr-web-dashboard-layout.md` — the UI layer (`tsk-3x6`).
```
