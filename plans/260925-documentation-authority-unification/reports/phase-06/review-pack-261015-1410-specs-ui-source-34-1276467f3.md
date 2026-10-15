# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-ui-spec-01.json
Shard SHA256: 92d9c405f3eb4795fc09b6b58504f33d1153a43505752799d0e7c463e83f9833
Source: docs/ui-spec/spec.config.yaml
Part 1/1; entries: **1**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 0/0 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_a7dc196cb13fecefb11ee504bd56df4d"
    ],
    "Weak-exact": [],
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


## claim_a7dc196cb13fecefb11ee504bd56df4d

Class: Unit-exact; mandatory deep: false.
Source: docs/ui-spec/spec.config.yaml#file-block; lines 1–24; ancestry [].
Target: docs/platform/ui-spec/architecture/spec.config.yaml#file-block; ancestry [].
Source digest: b18be20aa14e89f79e80cd3017c3bc240d51dd0851c583be1154eb427e7444eb
Target digest: b18be20aa14e89f79e80cd3017c3bc240d51dd0851c583be1154eb427e7444eb
Shown source SHA256: d71a1fa19b4472bda7890f5527be46e25cba684cfd9c6a041334a3704ed96737
Shown target SHA256: d71a1fa19b4472bda7890f5527be46e25cba684cfd9c6a041334a3704ed96737

### Complete proposed decision

```json
{
  "claimId": "claim_a7dc196cb13fecefb11ee504bd56df4d",
  "sourceUnitDigest": "b18be20aa14e89f79e80cd3017c3bc240d51dd0851c583be1154eb427e7444eb",
  "targetOwner": "docs/platform/ui-spec/architecture/spec.config.yaml",
  "targetAnchor": "file-block",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole file-block unit docs/ui-spec/spec.config.yaml#file-block (source lines 1-24) is carried at docs/platform/ui-spec/architecture/spec.config.yaml#file-block (candidate lines 1-24). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/ui-spec/spec.config.yaml verbatim in docs/platform/ui-spec/architecture/spec.config.yaml. Map kind architecture is retained. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "b18be20aa14e89f79e80cd3017c3bc240d51dd0851c583be1154eb427e7444eb",
  "targetAncestry": []
}
```

### Full source shown text

```text
# UI Spec configuration — herdr web dashboard
#
# Product source of truth: docs/specs/herdr-web-dashboard.md (tsk-54j).
# This spec adds the interaction/layout layer only; it never re-decides a
# product question the area spec already settled.

project: herdrweb
contract_tag: herdrweb-contract
entry_surface: S01
platforms: [desktop, mobile]

surface_dirs:
  - screens
  - modals
  - components
  - flows

cross_cutting:
  - 20-domain-rules.md
  - 15-system-events.md

extra_triggers: []
extra_actions: []
```

### Full target shown text

```text
# UI Spec configuration — herdr web dashboard
#
# Product source of truth: docs/specs/herdr-web-dashboard.md (tsk-54j).
# This spec adds the interaction/layout layer only; it never re-decides a
# product question the area spec already settled.

project: herdrweb
contract_tag: herdrweb-contract
entry_surface: S01
platforms: [desktop, mobile]

surface_dirs:
  - screens
  - modals
  - components
  - flows

cross_cutting:
  - 20-domain-rules.md
  - 15-system-events.md

extra_triggers: []
extra_actions: []
```
