# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json
Shard SHA256: 3d2bbc942e416345213d8b225e43ee69a2f63149f6b8768e23017f5dc829ed68
Source: docs/specs/confinement-authority.md
Part 1/7; entries: **41**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 10/11 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_28445ce7abe834f5e2bccedbe9b8889e",
      "claim_ba0b2e1a3bc56167392758ded5e83687",
      "claim_b37787b010e98b1593a8c6c64c103822",
      "claim_be68ea4edd1f4f0241883cc9def779c6",
      "claim_5ae789a08a8f79f3c477af66da37991f",
      "claim_1a5f2f8d637db33e541569e8bc3a0b77",
      "claim_0625608d3d14292eee1a9c772fdf2943",
      "claim_5acdd2b61706f8f7888eef81f73a88e8",
      "claim_e82c910f47e10ea84480da23a9b40d9e",
      "claim_1248b0418e459f1bc95c7327f21f62af",
      "claim_f0da93423628b5c149c0af2f278587ed",
      "claim_51b1a9d25306e44527217999038fb853",
      "claim_e3125befbd9b679d5d1fc64283064bfa",
      "claim_18f82ecfa8ca710243b4a9e2e4009871",
      "claim_7bc7717a92a34ad4dc50159f7cf1d93f",
      "claim_ee82a796cb4e8350b49633fc8b827c47",
      "claim_974ab4ff20c3e4ef63805c191e7dec9c",
      "claim_a73dbba44f9d78cb44cf898ec93bb955",
      "claim_9235033a167934865ae9528d85596b9d",
      "claim_261fd234537163e9c306c0990de2cccb",
      "claim_b9193c06d7a58f44eb151b6b730668bb",
      "claim_6ae075930d08b33b19fa26d11dddbb7e",
      "claim_1720c1e2b7546fb9abc46f977dca5825",
      "claim_579b1a0a3f1da1f0dd4b7cf68df7296c",
      "claim_35b15d0934b7b00d4dc499e636e5454a",
      "claim_f720709d19fbec377b1da6118d3017e1",
      "claim_8c0f0587e917eb027f7904f9d2ec5ab1",
      "claim_1818fed994fc49f9c1084ae57df27a01",
      "claim_467d37a7c682201f64cf45145bb77633",
      "claim_8986987d4027a2f84a4b4c69fc636ac8"
    ],
    "Weak-exact": [
      "claim_f28782f0b3d1c34833072a10b026b808",
      "claim_c63a6259672b4c3406cd8c18c559c1b0",
      "claim_f92bcfc37e44731bd0a188e9bd41cb7c",
      "claim_0f9d4212de2327b3df41fd6f706215a5",
      "claim_44bb41b373e3a877467622c4e64bfbfb",
      "claim_3357bf4450864c841ccb60bb3d03dcef",
      "claim_d4f22adcf76f556e71fd4b571c65fd02",
      "claim_f083b4f83f01dbdb32c7cd11aa57f872",
      "claim_3f9830e586c476dd28ffdb5e32b6ec72",
      "claim_42c16b046b463e8a2aea19bbd55e284c"
    ],
    "Judgment": [
      "claim_15b8c9068c1c07bed6aa09b4234faf4f"
    ]
  },
  "unequalDigestPairs": [
    "claim_15b8c9068c1c07bed6aa09b4234faf4f"
  ],
  "noTargetGeneratedRows": [],
  "mandatoryDeep": [
    "claim_15b8c9068c1c07bed6aa09b4234faf4f"
  ]
}
```


Return Reviewer, Author session(s), Review mode: ordinary, immutable content/request/shard pins, and one row per claim. Use ok/rework/hold, an own note prefixed deep or mechanical, full 64-hex digests; literal none for absent target. Consolidate parts by original shard before applying.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|


## claim_28445ce7abe834f5e2bccedbe9b8889e

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-1; lines 1–5; ancestry [].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-1; ancestry [].
Source digest: 8af62581941a8d7fbd1389929adcf64779ae231c0d39915b8a063af018279e49
Target digest: 8af62581941a8d7fbd1389929adcf64779ae231c0d39915b8a063af018279e49
Shown source SHA256: 8af62581941a8d7fbd1389929adcf64779ae231c0d39915b8a063af018279e49
Shown target SHA256: 8af62581941a8d7fbd1389929adcf64779ae231c0d39915b8a063af018279e49

### Complete proposed decision

```json
{
  "claimId": "claim_28445ce7abe834f5e2bccedbe9b8889e",
  "sourceUnitDigest": "8af62581941a8d7fbd1389929adcf64779ae231c0d39915b8a063af018279e49",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-1",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-preamble unit docs/specs/confinement-authority.md#unheaded-block-1 (source lines 1-5) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-1 (candidate lines 1-5). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "8af62581941a8d7fbd1389929adcf64779ae231c0d39915b8a063af018279e49",
  "targetAncestry": []
}
```

### Full source shown text

```text
---
area: agent-confinement-authority
updated: 2026-09-11
coverage: implemented
---
```

### Full target shown text

```text
---
area: agent-confinement-authority
updated: 2026-09-11
coverage: implemented
---
```

## claim_15b8c9068c1c07bed6aa09b4234faf4f

Class: Judgment; mandatory deep: true.
Source: docs/specs/confinement-authority.md#spec-agent-confinement-authority; lines 7–7; ancestry [].
Target: docs/platform/agent-confinement/spec.md#spec-agent-confinement-authority; ancestry [].
Source digest: d616d06522982d87caf2b59041a80220005e76ba36608070ce92bfb7644a45a3
Target digest: 8fb2143ec2d34a8501d2b0b5f4f81d0e0dd0300b41ac8af267bfb0c166e083b0
Shown source SHA256: 541274bc6d9f764881d62c7f854e7d03ee58ea40d89c1c25043edfc10640e640
Shown target SHA256: 719668a898e7df51ec727905b185b6781492c0f0b3c412e20840c2bae6126c94

### Complete proposed decision

```json
{
  "claimId": "claim_15b8c9068c1c07bed6aa09b4234faf4f",
  "sourceUnitDigest": "d616d06522982d87caf2b59041a80220005e76ba36608070ce92bfb7644a45a3",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "spec-agent-confinement-authority",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Judgment: no target digest match. The whole heading unit docs/specs/confinement-authority.md#spec-agent-confinement-authority (source lines 7-7) is carried at docs/platform/agent-confinement/spec.md#spec-agent-confinement-authority (candidate lines 7-7). The heading section digest changes because labelled candidate metadata is inserted after the original H1; original heading and direct source payload remain verbatim. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "8fb2143ec2d34a8501d2b0b5f4f81d0e0dd0300b41ac8af267bfb0c166e083b0",
  "targetAncestry": []
}
```

### Full source shown text

```text
# Spec: Agent Confinement Authority

> **Trạng thái:** IMPLEMENTED. Đã được hiện thực hoá hoàn chỉnh qua track `confinement-authority-implementation` (P00-P07).
> Một cửa runtime duy nhất `executeThroughConfinement` bảo vệ mọi dispatch ngoại trình (`cli-spawn`, `herdr-spawn`, `http`)
> trước khi adapter được spawn agent. Backend registry `~/.fgos/confinement-backends.json` quản lý backend instances máy chủ,
> driver `bwrap` v1 bảo đảm fail-closed cho `required` với 8 falsification probes. Ba executor bwrap (`claude-bwrap`, `agy-bwrap`, `codex-bwrap`)
> chỉ di trú sang backend reference ở dạng fixture (P04.md R4) — bản `.fgos/config.json` thật vẫn giữ hand-rolled `command:"bwrap"` argv,
> không có key `confinement`; live migration để deferred cho một phase sau (P06 thử tạm rồi revert nguyên trạng, sha256-verified). Live dogfood
> coordination đã chứng minh multi-agent cross-provider enforcement trên đường observe/legacy hiện có, không phụ thuộc migration nói trên.
> Chế độ strict mode (`runner.confinement.strict`) mặc định giữ `false` với chẩn đoán sẵn sàng từ `fgos doctor` (xem R1 decision).
>
> **Nguồn:** RUN1
> `plans/reports/architecture-advisory-panel-260909-2107-confinement-authority-fgos-dispatch-report.md`,
> RUN2
> `plans/reports/architecture-advisory-panel-260910-0216-confinement-authority-run2-decision-and-run1-comparison-report.md`,
> và source được đối chiếu ngày 2026-09-11.
```

### Full target shown text

````text
# Spec: Agent Confinement Authority

```txt
Document type: Specification
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve mapped legacy content for independent conservation review
Design status: Candidate
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/specs/confinement-authority.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing carriage, placement and source conservation
Do not use this for: Current canonical authority or implemented-behavior proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/specs/confinement-authority.md
Supersedes: None; candidate only
Superseded by: None
```

> Added in candidate: Candidate metadata and placement scaffolding. Split companions are listed in the area portal; original section numbers are retained. Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions.


> **Trạng thái:** IMPLEMENTED. Đã được hiện thực hoá hoàn chỉnh qua track `confinement-authority-implementation` (P00-P07).
> Một cửa runtime duy nhất `executeThroughConfinement` bảo vệ mọi dispatch ngoại trình (`cli-spawn`, `herdr-spawn`, `http`)
> trước khi adapter được spawn agent. Backend registry `~/.fgos/confinement-backends.json` quản lý backend instances máy chủ,
> driver `bwrap` v1 bảo đảm fail-closed cho `required` với 8 falsification probes. Ba executor bwrap (`claude-bwrap`, `agy-bwrap`, `codex-bwrap`)
> chỉ di trú sang backend reference ở dạng fixture (P04.md R4) — bản `.fgos/config.json` thật vẫn giữ hand-rolled `command:"bwrap"` argv,
> không có key `confinement`; live migration để deferred cho một phase sau (P06 thử tạm rồi revert nguyên trạng, sha256-verified). Live dogfood
> coordination đã chứng minh multi-agent cross-provider enforcement trên đường observe/legacy hiện có, không phụ thuộc migration nói trên.
> Chế độ strict mode (`runner.confinement.strict`) mặc định giữ `false` với chẩn đoán sẵn sàng từ `fgos doctor` (xem R1 decision).
>
> **Nguồn:** RUN1
> `plans/reports/architecture-advisory-panel-260909-2107-confinement-authority-fgos-dispatch-report.md`,
> RUN2
> `plans/reports/architecture-advisory-panel-260910-0216-confinement-authority-run2-decision-and-run1-comparison-report.md`,
> và source được đối chiếu ngày 2026-09-11.
````

## claim_ba0b2e1a3bc56167392758ded5e83687

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-2; lines 9–22; ancestry ["Spec: Agent Confinement Authority"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-4; ancestry ["Spec: Agent Confinement Authority"].
Source digest: 9c7a5f29c2242f9aae324b709b533335f6161724e9882e17db9d1a999d86988c
Target digest: 9c7a5f29c2242f9aae324b709b533335f6161724e9882e17db9d1a999d86988c
Shown source SHA256: 9c7a5f29c2242f9aae324b709b533335f6161724e9882e17db9d1a999d86988c
Shown target SHA256: 9c7a5f29c2242f9aae324b709b533335f6161724e9882e17db9d1a999d86988c

### Complete proposed decision

```json
{
  "claimId": "claim_ba0b2e1a3bc56167392758ded5e83687",
  "sourceUnitDigest": "9c7a5f29c2242f9aae324b709b533335f6161724e9882e17db9d1a999d86988c",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-4",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-2 (source lines 9-22) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-4 (candidate lines 31-44). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "9c7a5f29c2242f9aae324b709b533335f6161724e9882e17db9d1a999d86988c",
  "targetAncestry": [
    "Spec: Agent Confinement Authority"
  ]
}
```

### Full source shown text

```text
> **Trạng thái:** IMPLEMENTED. Đã được hiện thực hoá hoàn chỉnh qua track `confinement-authority-implementation` (P00-P07).
> Một cửa runtime duy nhất `executeThroughConfinement` bảo vệ mọi dispatch ngoại trình (`cli-spawn`, `herdr-spawn`, `http`)
> trước khi adapter được spawn agent. Backend registry `~/.fgos/confinement-backends.json` quản lý backend instances máy chủ,
> driver `bwrap` v1 bảo đảm fail-closed cho `required` với 8 falsification probes. Ba executor bwrap (`claude-bwrap`, `agy-bwrap`, `codex-bwrap`)
> chỉ di trú sang backend reference ở dạng fixture (P04.md R4) — bản `.fgos/config.json` thật vẫn giữ hand-rolled `command:"bwrap"` argv,
> không có key `confinement`; live migration để deferred cho một phase sau (P06 thử tạm rồi revert nguyên trạng, sha256-verified). Live dogfood
> coordination đã chứng minh multi-agent cross-provider enforcement trên đường observe/legacy hiện có, không phụ thuộc migration nói trên.
> Chế độ strict mode (`runner.confinement.strict`) mặc định giữ `false` với chẩn đoán sẵn sàng từ `fgos doctor` (xem R1 decision).
>
> **Nguồn:** RUN1
> `plans/reports/architecture-advisory-panel-260909-2107-confinement-authority-fgos-dispatch-report.md`,
> RUN2
> `plans/reports/architecture-advisory-panel-260910-0216-confinement-authority-run2-decision-and-run1-comparison-report.md`,
> và source được đối chiếu ngày 2026-09-11.
```

### Full target shown text

```text
> **Trạng thái:** IMPLEMENTED. Đã được hiện thực hoá hoàn chỉnh qua track `confinement-authority-implementation` (P00-P07).
> Một cửa runtime duy nhất `executeThroughConfinement` bảo vệ mọi dispatch ngoại trình (`cli-spawn`, `herdr-spawn`, `http`)
> trước khi adapter được spawn agent. Backend registry `~/.fgos/confinement-backends.json` quản lý backend instances máy chủ,
> driver `bwrap` v1 bảo đảm fail-closed cho `required` với 8 falsification probes. Ba executor bwrap (`claude-bwrap`, `agy-bwrap`, `codex-bwrap`)
> chỉ di trú sang backend reference ở dạng fixture (P04.md R4) — bản `.fgos/config.json` thật vẫn giữ hand-rolled `command:"bwrap"` argv,
> không có key `confinement`; live migration để deferred cho một phase sau (P06 thử tạm rồi revert nguyên trạng, sha256-verified). Live dogfood
> coordination đã chứng minh multi-agent cross-provider enforcement trên đường observe/legacy hiện có, không phụ thuộc migration nói trên.
> Chế độ strict mode (`runner.confinement.strict`) mặc định giữ `false` với chẩn đoán sẵn sàng từ `fgos doctor` (xem R1 decision).
>
> **Nguồn:** RUN1
> `plans/reports/architecture-advisory-panel-260909-2107-confinement-authority-fgos-dispatch-report.md`,
> RUN2
> `plans/reports/architecture-advisory-panel-260910-0216-confinement-authority-run2-decision-and-run1-comparison-report.md`,
> và source được đối chiếu ngày 2026-09-11.
```

## claim_f28782f0b3d1c34833072a10b026b808

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#1-quyết-định-kiến-trúc; lines 24–24; ancestry ["Spec: Agent Confinement Authority"].
Target: docs/platform/agent-confinement/spec.md#1-quyết-định-kiến-trúc; ancestry ["Spec: Agent Confinement Authority"].
Source digest: c119ae3b82e1912e427be4ae6078517a2a5e6b3658d78b2f2f5718bc9eb84b70
Target digest: c119ae3b82e1912e427be4ae6078517a2a5e6b3658d78b2f2f5718bc9eb84b70
Shown source SHA256: 07352abbb2f7f66cd5158df86d2c6e9d3fb4fade96f3aace37bc2e44a6a874a9
Shown target SHA256: 07352abbb2f7f66cd5158df86d2c6e9d3fb4fade96f3aace37bc2e44a6a874a9

### Complete proposed decision

```json
{
  "claimId": "claim_f28782f0b3d1c34833072a10b026b808",
  "sourceUnitDigest": "c119ae3b82e1912e427be4ae6078517a2a5e6b3658d78b2f2f5718bc9eb84b70",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "1-quyết-định-kiến-trúc",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/confinement-authority.md#1-quyết-định-kiến-trúc (source lines 24-24) is carried at docs/platform/agent-confinement/spec.md#1-quyết-định-kiến-trúc (candidate lines 46-46). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "c119ae3b82e1912e427be4ae6078517a2a5e6b3658d78b2f2f5718bc9eb84b70",
  "targetAncestry": [
    "Spec: Agent Confinement Authority"
  ]
}
```

### Full source shown text

````text
## 1. Quyết định kiến trúc

fgOS sẽ có **một cửa runtime duy nhất** cho mỗi lần đưa agent ra ngoài process:

```text
executeThroughConfinement(request, adapterPort) -> result + attestation
```

Mọi đường dispatch phải đi qua cửa này sau khi đã có đầy đủ `cwd`,
`repoRoot`, `runDir`, executor, invocation và adapter, nhưng trước khi adapter
được phép spawn hoặc giao việc cho agent. Agent Confinement Authority là thành phần
duy nhất được gọi executor adapter.

Bên trong cửa có nhiều bước: resolve policy, compile plan, prepare backend,
execute, attest và cleanup. Đó là **nhiều phase trong một authority**, không
phải hai cửa. Config validation cũng không phải cửa runtime; nó chỉ từ chối
cấu hình sai trước khi có dispatch.

Kết luận “không thể một cửa vì `runDir` sinh muộn” của RUN2 chỉ đúng nếu vẫn
đặt cửa ở `resolveExecutorConfig`. Nó không phải ràng buộc kiến trúc. Điểm kích
hoạt đúng là seam chung ngay trước adapter, sau `openDispatchRun`. Ở seam này,
cả hai đường hiện tại trong `dispatch/cli.mjs` đều đã có invocation đã resolve
và `runDir` cụ thể.
````

### Full target shown text

````text
## 1. Quyết định kiến trúc

fgOS sẽ có **một cửa runtime duy nhất** cho mỗi lần đưa agent ra ngoài process:

```text
executeThroughConfinement(request, adapterPort) -> result + attestation
```

Mọi đường dispatch phải đi qua cửa này sau khi đã có đầy đủ `cwd`,
`repoRoot`, `runDir`, executor, invocation và adapter, nhưng trước khi adapter
được phép spawn hoặc giao việc cho agent. Agent Confinement Authority là thành phần
duy nhất được gọi executor adapter.

Bên trong cửa có nhiều bước: resolve policy, compile plan, prepare backend,
execute, attest và cleanup. Đó là **nhiều phase trong một authority**, không
phải hai cửa. Config validation cũng không phải cửa runtime; nó chỉ từ chối
cấu hình sai trước khi có dispatch.

Kết luận “không thể một cửa vì `runDir` sinh muộn” của RUN2 chỉ đúng nếu vẫn
đặt cửa ở `resolveExecutorConfig`. Nó không phải ràng buộc kiến trúc. Điểm kích
hoạt đúng là seam chung ngay trước adapter, sau `openDispatchRun`. Ở seam này,
cả hai đường hiện tại trong `dispatch/cli.mjs` đều đã có invocation đã resolve
và `runDir` cụ thể.
````

## claim_b37787b010e98b1593a8c6c64c103822

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-3; lines 26–26; ancestry ["Spec: Agent Confinement Authority","1. Quyết định kiến trúc"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-5; ancestry ["Spec: Agent Confinement Authority","1. Quyết định kiến trúc"].
Source digest: 9d4d164e372af43991d3261be4b79b667ccf22f6638a95d779a39b5d8a2c507e
Target digest: 9d4d164e372af43991d3261be4b79b667ccf22f6638a95d779a39b5d8a2c507e
Shown source SHA256: 9d4d164e372af43991d3261be4b79b667ccf22f6638a95d779a39b5d8a2c507e
Shown target SHA256: 9d4d164e372af43991d3261be4b79b667ccf22f6638a95d779a39b5d8a2c507e

### Complete proposed decision

```json
{
  "claimId": "claim_b37787b010e98b1593a8c6c64c103822",
  "sourceUnitDigest": "9d4d164e372af43991d3261be4b79b667ccf22f6638a95d779a39b5d8a2c507e",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-5",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-3 (source lines 26-26) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-5 (candidate lines 48-48). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "9d4d164e372af43991d3261be4b79b667ccf22f6638a95d779a39b5d8a2c507e",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "1. Quyết định kiến trúc"
  ]
}
```

### Full source shown text

```text
fgOS sẽ có **một cửa runtime duy nhất** cho mỗi lần đưa agent ra ngoài process:
```

### Full target shown text

```text
fgOS sẽ có **một cửa runtime duy nhất** cho mỗi lần đưa agent ra ngoài process:
```

## claim_be68ea4edd1f4f0241883cc9def779c6

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-4; lines 28–30; ancestry ["Spec: Agent Confinement Authority","1. Quyết định kiến trúc"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-6; ancestry ["Spec: Agent Confinement Authority","1. Quyết định kiến trúc"].
Source digest: e384c0c10fe8fd6b869a7be0d2de9f930130ad7a1414087ffb543d0357fd4108
Target digest: e384c0c10fe8fd6b869a7be0d2de9f930130ad7a1414087ffb543d0357fd4108
Shown source SHA256: e384c0c10fe8fd6b869a7be0d2de9f930130ad7a1414087ffb543d0357fd4108
Shown target SHA256: e384c0c10fe8fd6b869a7be0d2de9f930130ad7a1414087ffb543d0357fd4108

### Complete proposed decision

```json
{
  "claimId": "claim_be68ea4edd1f4f0241883cc9def779c6",
  "sourceUnitDigest": "e384c0c10fe8fd6b869a7be0d2de9f930130ad7a1414087ffb543d0357fd4108",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-6",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-4 (source lines 28-30) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-6 (candidate lines 50-52). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "e384c0c10fe8fd6b869a7be0d2de9f930130ad7a1414087ffb543d0357fd4108",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "1. Quyết định kiến trúc"
  ]
}
```

### Full source shown text

````text
```text
executeThroughConfinement(request, adapterPort) -> result + attestation
```
````

### Full target shown text

````text
```text
executeThroughConfinement(request, adapterPort) -> result + attestation
```
````

## claim_5ae789a08a8f79f3c477af66da37991f

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-5; lines 32–35; ancestry ["Spec: Agent Confinement Authority","1. Quyết định kiến trúc"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-7; ancestry ["Spec: Agent Confinement Authority","1. Quyết định kiến trúc"].
Source digest: 1bd83bcb38f40d1a4ed245ba1b513ab5a174bd6bc1b4d2f3a931766b5b0bd96d
Target digest: 1bd83bcb38f40d1a4ed245ba1b513ab5a174bd6bc1b4d2f3a931766b5b0bd96d
Shown source SHA256: 1bd83bcb38f40d1a4ed245ba1b513ab5a174bd6bc1b4d2f3a931766b5b0bd96d
Shown target SHA256: 1bd83bcb38f40d1a4ed245ba1b513ab5a174bd6bc1b4d2f3a931766b5b0bd96d

### Complete proposed decision

```json
{
  "claimId": "claim_5ae789a08a8f79f3c477af66da37991f",
  "sourceUnitDigest": "1bd83bcb38f40d1a4ed245ba1b513ab5a174bd6bc1b4d2f3a931766b5b0bd96d",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-7",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-5 (source lines 32-35) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-7 (candidate lines 54-57). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "1bd83bcb38f40d1a4ed245ba1b513ab5a174bd6bc1b4d2f3a931766b5b0bd96d",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "1. Quyết định kiến trúc"
  ]
}
```

### Full source shown text

```text
Mọi đường dispatch phải đi qua cửa này sau khi đã có đầy đủ `cwd`,
`repoRoot`, `runDir`, executor, invocation và adapter, nhưng trước khi adapter
được phép spawn hoặc giao việc cho agent. Agent Confinement Authority là thành phần
duy nhất được gọi executor adapter.
```

### Full target shown text

```text
Mọi đường dispatch phải đi qua cửa này sau khi đã có đầy đủ `cwd`,
`repoRoot`, `runDir`, executor, invocation và adapter, nhưng trước khi adapter
được phép spawn hoặc giao việc cho agent. Agent Confinement Authority là thành phần
duy nhất được gọi executor adapter.
```

## claim_1a5f2f8d637db33e541569e8bc3a0b77

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-6; lines 37–40; ancestry ["Spec: Agent Confinement Authority","1. Quyết định kiến trúc"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-8; ancestry ["Spec: Agent Confinement Authority","1. Quyết định kiến trúc"].
Source digest: ea53abaf5e95cecd30240f63cad49962f5acca16df85c4a32c65dba40a621dac
Target digest: ea53abaf5e95cecd30240f63cad49962f5acca16df85c4a32c65dba40a621dac
Shown source SHA256: ea53abaf5e95cecd30240f63cad49962f5acca16df85c4a32c65dba40a621dac
Shown target SHA256: ea53abaf5e95cecd30240f63cad49962f5acca16df85c4a32c65dba40a621dac

### Complete proposed decision

```json
{
  "claimId": "claim_1a5f2f8d637db33e541569e8bc3a0b77",
  "sourceUnitDigest": "ea53abaf5e95cecd30240f63cad49962f5acca16df85c4a32c65dba40a621dac",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-8",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-6 (source lines 37-40) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-8 (candidate lines 59-62). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "ea53abaf5e95cecd30240f63cad49962f5acca16df85c4a32c65dba40a621dac",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "1. Quyết định kiến trúc"
  ]
}
```

### Full source shown text

```text
Bên trong cửa có nhiều bước: resolve policy, compile plan, prepare backend,
execute, attest và cleanup. Đó là **nhiều phase trong một authority**, không
phải hai cửa. Config validation cũng không phải cửa runtime; nó chỉ từ chối
cấu hình sai trước khi có dispatch.
```

### Full target shown text

```text
Bên trong cửa có nhiều bước: resolve policy, compile plan, prepare backend,
execute, attest và cleanup. Đó là **nhiều phase trong một authority**, không
phải hai cửa. Config validation cũng không phải cửa runtime; nó chỉ từ chối
cấu hình sai trước khi có dispatch.
```

## claim_0625608d3d14292eee1a9c772fdf2943

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-7; lines 42–46; ancestry ["Spec: Agent Confinement Authority","1. Quyết định kiến trúc"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-9; ancestry ["Spec: Agent Confinement Authority","1. Quyết định kiến trúc"].
Source digest: c925e836abc1dfa057f90f82e9c2307792e1fce53c77e881c1359cd136acb642
Target digest: c925e836abc1dfa057f90f82e9c2307792e1fce53c77e881c1359cd136acb642
Shown source SHA256: c925e836abc1dfa057f90f82e9c2307792e1fce53c77e881c1359cd136acb642
Shown target SHA256: c925e836abc1dfa057f90f82e9c2307792e1fce53c77e881c1359cd136acb642

### Complete proposed decision

```json
{
  "claimId": "claim_0625608d3d14292eee1a9c772fdf2943",
  "sourceUnitDigest": "c925e836abc1dfa057f90f82e9c2307792e1fce53c77e881c1359cd136acb642",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-9",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-7 (source lines 42-46) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-9 (candidate lines 64-68). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "c925e836abc1dfa057f90f82e9c2307792e1fce53c77e881c1359cd136acb642",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "1. Quyết định kiến trúc"
  ]
}
```

### Full source shown text

```text
Kết luận “không thể một cửa vì `runDir` sinh muộn” của RUN2 chỉ đúng nếu vẫn
đặt cửa ở `resolveExecutorConfig`. Nó không phải ràng buộc kiến trúc. Điểm kích
hoạt đúng là seam chung ngay trước adapter, sau `openDispatchRun`. Ở seam này,
cả hai đường hiện tại trong `dispatch/cli.mjs` đều đã có invocation đã resolve
và `runDir` cụ thể.
```

### Full target shown text

```text
Kết luận “không thể một cửa vì `runDir` sinh muộn” của RUN2 chỉ đúng nếu vẫn
đặt cửa ở `resolveExecutorConfig`. Nó không phải ràng buộc kiến trúc. Điểm kích
hoạt đúng là seam chung ngay trước adapter, sau `openDispatchRun`. Ở seam này,
cả hai đường hiện tại trong `dispatch/cli.mjs` đều đã có invocation đã resolve
và `runDir` cụ thể.
```

## claim_c63a6259672b4c3406cd8c18c559c1b0

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#11-vì-sao-một-cửa-quan-trọng; lines 48–48; ancestry ["Spec: Agent Confinement Authority","1. Quyết định kiến trúc"].
Target: docs/platform/agent-confinement/spec.md#11-vì-sao-một-cửa-quan-trọng; ancestry ["Spec: Agent Confinement Authority","1. Quyết định kiến trúc"].
Source digest: 01917de3660e3d39505f58b3957a70b7bab65168b52a8d36442f945802b419f3
Target digest: 01917de3660e3d39505f58b3957a70b7bab65168b52a8d36442f945802b419f3
Shown source SHA256: 4c1e2f1b88e965cd320dfa0b8020f52360718b4bc5c30daf3d8a7c8646ed631c
Shown target SHA256: 4c1e2f1b88e965cd320dfa0b8020f52360718b4bc5c30daf3d8a7c8646ed631c

### Complete proposed decision

```json
{
  "claimId": "claim_c63a6259672b4c3406cd8c18c559c1b0",
  "sourceUnitDigest": "01917de3660e3d39505f58b3957a70b7bab65168b52a8d36442f945802b419f3",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "11-vì-sao-một-cửa-quan-trọng",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/confinement-authority.md#11-vì-sao-một-cửa-quan-trọng (source lines 48-48) is carried at docs/platform/agent-confinement/spec.md#11-vì-sao-một-cửa-quan-trọng (candidate lines 70-70). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "01917de3660e3d39505f58b3957a70b7bab65168b52a8d36442f945802b419f3",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "1. Quyết định kiến trúc"
  ]
}
```

### Full source shown text

```text
### 1.1 Vì sao một cửa quan trọng

- Không adapter nào có thể quên đọc `confinement`, như `cliSpawnAdapter` hôm nay.
- Attestation và hành vi được sinh bởi cùng một authority; không còn đường
  “khai một nơi, spawn một nơi khác”.
- Thêm adapter hoặc backend mới không tạo thêm enforcement point.
- Policy dùng được dữ kiện runtime mà không đẩy logic confinement ngược vào resolver.
- Audit call graph chỉ cần chứng minh không có production call site nào gọi
  executor adapter ngoài Agent Confinement Authority.
```

### Full target shown text

```text
### 1.1 Vì sao một cửa quan trọng

- Không adapter nào có thể quên đọc `confinement`, như `cliSpawnAdapter` hôm nay.
- Attestation và hành vi được sinh bởi cùng một authority; không còn đường
  “khai một nơi, spawn một nơi khác”.
- Thêm adapter hoặc backend mới không tạo thêm enforcement point.
- Policy dùng được dữ kiện runtime mà không đẩy logic confinement ngược vào resolver.
- Audit call graph chỉ cần chứng minh không có production call site nào gọi
  executor adapter ngoài Agent Confinement Authority.
```

## claim_5acdd2b61706f8f7888eef81f73a88e8

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-8; lines 50–56; ancestry ["Spec: Agent Confinement Authority","1. Quyết định kiến trúc","1.1 Vì sao một cửa quan trọng"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-10; ancestry ["Spec: Agent Confinement Authority","1. Quyết định kiến trúc","1.1 Vì sao một cửa quan trọng"].
Source digest: 85615858f7582bd250778a1f45ac6b437662679bf2ef85ee4e21bc4020380a96
Target digest: 85615858f7582bd250778a1f45ac6b437662679bf2ef85ee4e21bc4020380a96
Shown source SHA256: 85615858f7582bd250778a1f45ac6b437662679bf2ef85ee4e21bc4020380a96
Shown target SHA256: 85615858f7582bd250778a1f45ac6b437662679bf2ef85ee4e21bc4020380a96

### Complete proposed decision

```json
{
  "claimId": "claim_5acdd2b61706f8f7888eef81f73a88e8",
  "sourceUnitDigest": "85615858f7582bd250778a1f45ac6b437662679bf2ef85ee4e21bc4020380a96",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-10",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-8 (source lines 50-56) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-10 (candidate lines 72-78). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "85615858f7582bd250778a1f45ac6b437662679bf2ef85ee4e21bc4020380a96",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "1. Quyết định kiến trúc",
    "1.1 Vì sao một cửa quan trọng"
  ]
}
```

### Full source shown text

```text
- Không adapter nào có thể quên đọc `confinement`, như `cliSpawnAdapter` hôm nay.
- Attestation và hành vi được sinh bởi cùng một authority; không còn đường
  “khai một nơi, spawn một nơi khác”.
- Thêm adapter hoặc backend mới không tạo thêm enforcement point.
- Policy dùng được dữ kiện runtime mà không đẩy logic confinement ngược vào resolver.
- Audit call graph chỉ cần chứng minh không có production call site nào gọi
  executor adapter ngoài Agent Confinement Authority.
```

### Full target shown text

```text
- Không adapter nào có thể quên đọc `confinement`, như `cliSpawnAdapter` hôm nay.
- Attestation và hành vi được sinh bởi cùng một authority; không còn đường
  “khai một nơi, spawn một nơi khác”.
- Thêm adapter hoặc backend mới không tạo thêm enforcement point.
- Policy dùng được dữ kiện runtime mà không đẩy logic confinement ngược vào resolver.
- Audit call graph chỉ cần chứng minh không có production call site nào gọi
  executor adapter ngoài Agent Confinement Authority.
```

## claim_e82c910f47e10ea84480da23a9b40d9e

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#2-vấn-đề-lịch-sử-và-giải-pháp-đã-chốt; lines 58–58; ancestry ["Spec: Agent Confinement Authority"].
Target: docs/platform/agent-confinement/spec.md#2-vấn-đề-lịch-sử-và-giải-pháp-đã-chốt; ancestry ["Spec: Agent Confinement Authority"].
Source digest: cdc2076b281a4cc71b1c038a08fa902599137f915486ba487deede97672be124
Target digest: cdc2076b281a4cc71b1c038a08fa902599137f915486ba487deede97672be124
Shown source SHA256: 64ba42ad849e57e673d13390e7248a582ca4763c6b1b1e59a7d214c424c06898
Shown target SHA256: 64ba42ad849e57e673d13390e7248a582ca4763c6b1b1e59a7d214c424c06898

### Complete proposed decision

```json
{
  "claimId": "claim_e82c910f47e10ea84480da23a9b40d9e",
  "sourceUnitDigest": "cdc2076b281a4cc71b1c038a08fa902599137f915486ba487deede97672be124",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "2-vấn-đề-lịch-sử-và-giải-pháp-đã-chốt",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole heading unit docs/specs/confinement-authority.md#2-vấn-đề-lịch-sử-và-giải-pháp-đã-chốt (source lines 58-58) is carried at docs/platform/agent-confinement/spec.md#2-vấn-đề-lịch-sử-và-giải-pháp-đã-chốt (candidate lines 80-80). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "cdc2076b281a4cc71b1c038a08fa902599137f915486ba487deede97672be124",
  "targetAncestry": [
    "Spec: Agent Confinement Authority"
  ]
}
```

### Full source shown text

```text
## 2. Vấn đề lịch sử và giải pháp đã chốt

Trước track `confinement-authority-implementation`, hệ thống có hai cơ chế phân mảnh:
1. **Session hygiene:** `confinement: {privateHome, isolatedSession, ownWorktree}` chỉ áp dụng trong `herdr-round.mjs`.
2. **OS filesystem:** argv `bwrap` viết tay rải rác trong cấu hình executor (`claude-bwrap`, `agy-bwrap`, `codex-bwrap`).

Bốn đường fail-open đã được xác nhận và đóng triệt để:

| ID | Đường hở lịch sử | Giải pháp đã đóng (Settled) |
|---|---|---|
| F-a | `cliSpawnAdapter` bỏ qua field `confinement` | Hoàn thành ở P04: `cliSpawnAdapter` bắt buộc tiêu thụ invocation đã prepare bởi Authority; không còn đường unconfined ngầm. |
| F-b | `invocations[].confinement` không validate nhưng lại ưu tiên hơn | Hoàn thành ở P02/P04: validate nghiêm ngặt invocation override; cấm hạ cấp control, cấm thêm grant, cấm đổi policy id hay flip unconfined. |
| F-c | capability không có `prefer` rơi về executor không confinement | Hoàn thành ở P04: fallback preserve anchor gốc và mang theo policy của anchor đó. |
| F-d | `establishConfinement` không có khai báo vẫn trả kết quả thành công | Hoàn thành ở P04/P05: `ownWorktree` đơn lẻ không còn được coi là `confined: true`; hàm dùng chung `evaluateBypassPairing` ép buộc bypass phải có đủ privateHome, isolatedSession và ownWorktree. |

Cả hai cơ chế đã được hợp nhất dưới một cửa Confinement Authority runtime.
```

### Full target shown text

```text
## 2. Vấn đề lịch sử và giải pháp đã chốt

Trước track `confinement-authority-implementation`, hệ thống có hai cơ chế phân mảnh:
1. **Session hygiene:** `confinement: {privateHome, isolatedSession, ownWorktree}` chỉ áp dụng trong `herdr-round.mjs`.
2. **OS filesystem:** argv `bwrap` viết tay rải rác trong cấu hình executor (`claude-bwrap`, `agy-bwrap`, `codex-bwrap`).

Bốn đường fail-open đã được xác nhận và đóng triệt để:

| ID | Đường hở lịch sử | Giải pháp đã đóng (Settled) |
|---|---|---|
| F-a | `cliSpawnAdapter` bỏ qua field `confinement` | Hoàn thành ở P04: `cliSpawnAdapter` bắt buộc tiêu thụ invocation đã prepare bởi Authority; không còn đường unconfined ngầm. |
| F-b | `invocations[].confinement` không validate nhưng lại ưu tiên hơn | Hoàn thành ở P02/P04: validate nghiêm ngặt invocation override; cấm hạ cấp control, cấm thêm grant, cấm đổi policy id hay flip unconfined. |
| F-c | capability không có `prefer` rơi về executor không confinement | Hoàn thành ở P04: fallback preserve anchor gốc và mang theo policy của anchor đó. |
| F-d | `establishConfinement` không có khai báo vẫn trả kết quả thành công | Hoàn thành ở P04/P05: `ownWorktree` đơn lẻ không còn được coi là `confined: true`; hàm dùng chung `evaluateBypassPairing` ép buộc bypass phải có đủ privateHome, isolatedSession và ownWorktree. |

Cả hai cơ chế đã được hợp nhất dưới một cửa Confinement Authority runtime.
```

## claim_1248b0418e459f1bc95c7327f21f62af

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-9; lines 60–62; ancestry ["Spec: Agent Confinement Authority","2. Vấn đề lịch sử và giải pháp đã chốt"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-11; ancestry ["Spec: Agent Confinement Authority","2. Vấn đề lịch sử và giải pháp đã chốt"].
Source digest: f5322e1b6b0a6cc2889ea9c713ab098d0caf9520f7aa856f5c72e0bf63f9e4b4
Target digest: f5322e1b6b0a6cc2889ea9c713ab098d0caf9520f7aa856f5c72e0bf63f9e4b4
Shown source SHA256: f5322e1b6b0a6cc2889ea9c713ab098d0caf9520f7aa856f5c72e0bf63f9e4b4
Shown target SHA256: f5322e1b6b0a6cc2889ea9c713ab098d0caf9520f7aa856f5c72e0bf63f9e4b4

### Complete proposed decision

```json
{
  "claimId": "claim_1248b0418e459f1bc95c7327f21f62af",
  "sourceUnitDigest": "f5322e1b6b0a6cc2889ea9c713ab098d0caf9520f7aa856f5c72e0bf63f9e4b4",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-11",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-9 (source lines 60-62) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-11 (candidate lines 82-84). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "f5322e1b6b0a6cc2889ea9c713ab098d0caf9520f7aa856f5c72e0bf63f9e4b4",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "2. Vấn đề lịch sử và giải pháp đã chốt"
  ]
}
```

### Full source shown text

```text
Trước track `confinement-authority-implementation`, hệ thống có hai cơ chế phân mảnh:
1. **Session hygiene:** `confinement: {privateHome, isolatedSession, ownWorktree}` chỉ áp dụng trong `herdr-round.mjs`.
2. **OS filesystem:** argv `bwrap` viết tay rải rác trong cấu hình executor (`claude-bwrap`, `agy-bwrap`, `codex-bwrap`).
```

### Full target shown text

```text
Trước track `confinement-authority-implementation`, hệ thống có hai cơ chế phân mảnh:
1. **Session hygiene:** `confinement: {privateHome, isolatedSession, ownWorktree}` chỉ áp dụng trong `herdr-round.mjs`.
2. **OS filesystem:** argv `bwrap` viết tay rải rác trong cấu hình executor (`claude-bwrap`, `agy-bwrap`, `codex-bwrap`).
```

## claim_f0da93423628b5c149c0af2f278587ed

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-10; lines 64–64; ancestry ["Spec: Agent Confinement Authority","2. Vấn đề lịch sử và giải pháp đã chốt"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-12; ancestry ["Spec: Agent Confinement Authority","2. Vấn đề lịch sử và giải pháp đã chốt"].
Source digest: df9207a3ace166343d8025978e5409c42dfd1ce28e4de1e88ca5499e66703881
Target digest: df9207a3ace166343d8025978e5409c42dfd1ce28e4de1e88ca5499e66703881
Shown source SHA256: df9207a3ace166343d8025978e5409c42dfd1ce28e4de1e88ca5499e66703881
Shown target SHA256: df9207a3ace166343d8025978e5409c42dfd1ce28e4de1e88ca5499e66703881

### Complete proposed decision

```json
{
  "claimId": "claim_f0da93423628b5c149c0af2f278587ed",
  "sourceUnitDigest": "df9207a3ace166343d8025978e5409c42dfd1ce28e4de1e88ca5499e66703881",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-12",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-10 (source lines 64-64) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-12 (candidate lines 86-86). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "df9207a3ace166343d8025978e5409c42dfd1ce28e4de1e88ca5499e66703881",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "2. Vấn đề lịch sử và giải pháp đã chốt"
  ]
}
```

### Full source shown text

```text
Bốn đường fail-open đã được xác nhận và đóng triệt để:
```

### Full target shown text

```text
Bốn đường fail-open đã được xác nhận và đóng triệt để:
```

## claim_51b1a9d25306e44527217999038fb853

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-11; lines 66–71; ancestry ["Spec: Agent Confinement Authority","2. Vấn đề lịch sử và giải pháp đã chốt"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-13; ancestry ["Spec: Agent Confinement Authority","2. Vấn đề lịch sử và giải pháp đã chốt"].
Source digest: 3cf2768b10b9304382d4ba662dcef7f1a45677693e3747976d99c21b9b80188c
Target digest: 3cf2768b10b9304382d4ba662dcef7f1a45677693e3747976d99c21b9b80188c
Shown source SHA256: 3cf2768b10b9304382d4ba662dcef7f1a45677693e3747976d99c21b9b80188c
Shown target SHA256: 3cf2768b10b9304382d4ba662dcef7f1a45677693e3747976d99c21b9b80188c

### Complete proposed decision

```json
{
  "claimId": "claim_51b1a9d25306e44527217999038fb853",
  "sourceUnitDigest": "3cf2768b10b9304382d4ba662dcef7f1a45677693e3747976d99c21b9b80188c",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-13",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-11 (source lines 66-71) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-13 (candidate lines 88-93). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "3cf2768b10b9304382d4ba662dcef7f1a45677693e3747976d99c21b9b80188c",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "2. Vấn đề lịch sử và giải pháp đã chốt"
  ]
}
```

### Full source shown text

```text
| ID | Đường hở lịch sử | Giải pháp đã đóng (Settled) |
|---|---|---|
| F-a | `cliSpawnAdapter` bỏ qua field `confinement` | Hoàn thành ở P04: `cliSpawnAdapter` bắt buộc tiêu thụ invocation đã prepare bởi Authority; không còn đường unconfined ngầm. |
| F-b | `invocations[].confinement` không validate nhưng lại ưu tiên hơn | Hoàn thành ở P02/P04: validate nghiêm ngặt invocation override; cấm hạ cấp control, cấm thêm grant, cấm đổi policy id hay flip unconfined. |
| F-c | capability không có `prefer` rơi về executor không confinement | Hoàn thành ở P04: fallback preserve anchor gốc và mang theo policy của anchor đó. |
| F-d | `establishConfinement` không có khai báo vẫn trả kết quả thành công | Hoàn thành ở P04/P05: `ownWorktree` đơn lẻ không còn được coi là `confined: true`; hàm dùng chung `evaluateBypassPairing` ép buộc bypass phải có đủ privateHome, isolatedSession và ownWorktree. |
```

### Full target shown text

```text
| ID | Đường hở lịch sử | Giải pháp đã đóng (Settled) |
|---|---|---|
| F-a | `cliSpawnAdapter` bỏ qua field `confinement` | Hoàn thành ở P04: `cliSpawnAdapter` bắt buộc tiêu thụ invocation đã prepare bởi Authority; không còn đường unconfined ngầm. |
| F-b | `invocations[].confinement` không validate nhưng lại ưu tiên hơn | Hoàn thành ở P02/P04: validate nghiêm ngặt invocation override; cấm hạ cấp control, cấm thêm grant, cấm đổi policy id hay flip unconfined. |
| F-c | capability không có `prefer` rơi về executor không confinement | Hoàn thành ở P04: fallback preserve anchor gốc và mang theo policy của anchor đó. |
| F-d | `establishConfinement` không có khai báo vẫn trả kết quả thành công | Hoàn thành ở P04/P05: `ownWorktree` đơn lẻ không còn được coi là `confined: true`; hàm dùng chung `evaluateBypassPairing` ép buộc bypass phải có đủ privateHome, isolatedSession và ownWorktree. |
```

## claim_e3125befbd9b679d5d1fc64283064bfa

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-12; lines 73–73; ancestry ["Spec: Agent Confinement Authority","2. Vấn đề lịch sử và giải pháp đã chốt"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-14; ancestry ["Spec: Agent Confinement Authority","2. Vấn đề lịch sử và giải pháp đã chốt"].
Source digest: 26140143831da0f2e8c9e325debb900f01b964c4da8e833176574e14292d86fb
Target digest: 26140143831da0f2e8c9e325debb900f01b964c4da8e833176574e14292d86fb
Shown source SHA256: 26140143831da0f2e8c9e325debb900f01b964c4da8e833176574e14292d86fb
Shown target SHA256: 26140143831da0f2e8c9e325debb900f01b964c4da8e833176574e14292d86fb

### Complete proposed decision

```json
{
  "claimId": "claim_e3125befbd9b679d5d1fc64283064bfa",
  "sourceUnitDigest": "26140143831da0f2e8c9e325debb900f01b964c4da8e833176574e14292d86fb",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-14",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-12 (source lines 73-73) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-14 (candidate lines 95-95). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "26140143831da0f2e8c9e325debb900f01b964c4da8e833176574e14292d86fb",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "2. Vấn đề lịch sử và giải pháp đã chốt"
  ]
}
```

### Full source shown text

```text
Cả hai cơ chế đã được hợp nhất dưới một cửa Confinement Authority runtime.
```

### Full target shown text

```text
Cả hai cơ chế đã được hợp nhất dưới một cửa Confinement Authority runtime.
```

## claim_f92bcfc37e44731bd0a188e9bd41cb7c

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#3-mục-tiêu-và-phi-mục-tiêu; lines 75–75; ancestry ["Spec: Agent Confinement Authority"].
Target: docs/platform/agent-confinement/spec.md#3-mục-tiêu-và-phi-mục-tiêu; ancestry ["Spec: Agent Confinement Authority"].
Source digest: e611e532ff4cc0f1c9168081419271fc8db68b61d56867614551f7b660d21400
Target digest: e611e532ff4cc0f1c9168081419271fc8db68b61d56867614551f7b660d21400
Shown source SHA256: 1ac8bd1140c8a6a118e92facb0a5c60ac2c2eec79e30238a3814d15029df5f2d
Shown target SHA256: 1ac8bd1140c8a6a118e92facb0a5c60ac2c2eec79e30238a3814d15029df5f2d

### Complete proposed decision

```json
{
  "claimId": "claim_f92bcfc37e44731bd0a188e9bd41cb7c",
  "sourceUnitDigest": "e611e532ff4cc0f1c9168081419271fc8db68b61d56867614551f7b660d21400",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "3-mục-tiêu-và-phi-mục-tiêu",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/confinement-authority.md#3-mục-tiêu-và-phi-mục-tiêu (source lines 75-75) is carried at docs/platform/agent-confinement/spec.md#3-mục-tiêu-và-phi-mục-tiêu (candidate lines 97-97). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "e611e532ff4cc0f1c9168081419271fc8db68b61d56867614551f7b660d21400",
  "targetAncestry": [
    "Spec: Agent Confinement Authority"
  ]
}
```

### Full source shown text

```text
## 3. Mục tiêu và phi mục tiêu
```

### Full target shown text

```text
## 3. Mục tiêu và phi mục tiêu
```

## claim_0f9d4212de2327b3df41fd6f706215a5

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#31-mục-tiêu; lines 77–77; ancestry ["Spec: Agent Confinement Authority","3. Mục tiêu và phi mục tiêu"].
Target: docs/platform/agent-confinement/spec.md#31-mục-tiêu; ancestry ["Spec: Agent Confinement Authority","3. Mục tiêu và phi mục tiêu"].
Source digest: 95910a9adb38ca27d11f8417e6bc455e771873351ec383f854dea2a11a4014c9
Target digest: 95910a9adb38ca27d11f8417e6bc455e771873351ec383f854dea2a11a4014c9
Shown source SHA256: 6d18da050787eb7ea17e7ad3efacf3e973a38d0b29258fe940a183e509c6a8b9
Shown target SHA256: 6d18da050787eb7ea17e7ad3efacf3e973a38d0b29258fe940a183e509c6a8b9

### Complete proposed decision

```json
{
  "claimId": "claim_0f9d4212de2327b3df41fd6f706215a5",
  "sourceUnitDigest": "95910a9adb38ca27d11f8417e6bc455e771873351ec383f854dea2a11a4014c9",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "31-mục-tiêu",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/confinement-authority.md#31-mục-tiêu (source lines 77-77) is carried at docs/platform/agent-confinement/spec.md#31-mục-tiêu (candidate lines 99-99). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "95910a9adb38ca27d11f8417e6bc455e771873351ec383f854dea2a11a4014c9",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "3. Mục tiêu và phi mục tiêu"
  ]
}
```

### Full source shown text

```text
### 3.1 Mục tiêu

1. Mỗi dispatch có một kết quả rõ ràng: `enforced`, `unconfined`,
   `degraded`, `refused` hoặc `unknown`.
2. Policy được so với năng lực backend và hành vi thực tế; mismatch không bao
   giờ bị nuốt im.
3. Dispatch `required` phải fail closed trước khi agent chạy.
4. Vùng ghi được cấp theo tài nguyên runtime của chính dispatch, đặc biệt
   `runDir`, không bằng absolute path machine-specific trong config.
5. Contract diễn tả đúng từng trục bảo vệ, không dùng nhãn mơ hồ như
   `read-only` để overclaim.
6. Hỗ trợ nhiều loại backend và nhiều backend instance mà không đổi contract
   của caller; mỗi dispatch vẫn chỉ dùng đúng một backend instance.
7. Một implementation đầu tiên nhỏ vẫn là tập con hợp lệ của contract đích.
```

### Full target shown text

```text
### 3.1 Mục tiêu

1. Mỗi dispatch có một kết quả rõ ràng: `enforced`, `unconfined`,
   `degraded`, `refused` hoặc `unknown`.
2. Policy được so với năng lực backend và hành vi thực tế; mismatch không bao
   giờ bị nuốt im.
3. Dispatch `required` phải fail closed trước khi agent chạy.
4. Vùng ghi được cấp theo tài nguyên runtime của chính dispatch, đặc biệt
   `runDir`, không bằng absolute path machine-specific trong config.
5. Contract diễn tả đúng từng trục bảo vệ, không dùng nhãn mơ hồ như
   `read-only` để overclaim.
6. Hỗ trợ nhiều loại backend và nhiều backend instance mà không đổi contract
   của caller; mỗi dispatch vẫn chỉ dùng đúng một backend instance.
7. Một implementation đầu tiên nhỏ vẫn là tập con hợp lệ của contract đích.
```

## claim_18f82ecfa8ca710243b4a9e2e4009871

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-13; lines 79–90; ancestry ["Spec: Agent Confinement Authority","3. Mục tiêu và phi mục tiêu","3.1 Mục tiêu"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-15; ancestry ["Spec: Agent Confinement Authority","3. Mục tiêu và phi mục tiêu","3.1 Mục tiêu"].
Source digest: 5988e9107c5e1f93a6a203244071b7020b294ab5b855fea771691a4504177421
Target digest: 5988e9107c5e1f93a6a203244071b7020b294ab5b855fea771691a4504177421
Shown source SHA256: 5988e9107c5e1f93a6a203244071b7020b294ab5b855fea771691a4504177421
Shown target SHA256: 5988e9107c5e1f93a6a203244071b7020b294ab5b855fea771691a4504177421

### Complete proposed decision

```json
{
  "claimId": "claim_18f82ecfa8ca710243b4a9e2e4009871",
  "sourceUnitDigest": "5988e9107c5e1f93a6a203244071b7020b294ab5b855fea771691a4504177421",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-15",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-13 (source lines 79-90) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-15 (candidate lines 101-112). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "5988e9107c5e1f93a6a203244071b7020b294ab5b855fea771691a4504177421",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "3. Mục tiêu và phi mục tiêu",
    "3.1 Mục tiêu"
  ]
}
```

### Full source shown text

```text
1. Mỗi dispatch có một kết quả rõ ràng: `enforced`, `unconfined`,
   `degraded`, `refused` hoặc `unknown`.
2. Policy được so với năng lực backend và hành vi thực tế; mismatch không bao
   giờ bị nuốt im.
3. Dispatch `required` phải fail closed trước khi agent chạy.
4. Vùng ghi được cấp theo tài nguyên runtime của chính dispatch, đặc biệt
   `runDir`, không bằng absolute path machine-specific trong config.
5. Contract diễn tả đúng từng trục bảo vệ, không dùng nhãn mơ hồ như
   `read-only` để overclaim.
6. Hỗ trợ nhiều loại backend và nhiều backend instance mà không đổi contract
   của caller; mỗi dispatch vẫn chỉ dùng đúng một backend instance.
7. Một implementation đầu tiên nhỏ vẫn là tập con hợp lệ của contract đích.
```

### Full target shown text

```text
1. Mỗi dispatch có một kết quả rõ ràng: `enforced`, `unconfined`,
   `degraded`, `refused` hoặc `unknown`.
2. Policy được so với năng lực backend và hành vi thực tế; mismatch không bao
   giờ bị nuốt im.
3. Dispatch `required` phải fail closed trước khi agent chạy.
4. Vùng ghi được cấp theo tài nguyên runtime của chính dispatch, đặc biệt
   `runDir`, không bằng absolute path machine-specific trong config.
5. Contract diễn tả đúng từng trục bảo vệ, không dùng nhãn mơ hồ như
   `read-only` để overclaim.
6. Hỗ trợ nhiều loại backend và nhiều backend instance mà không đổi contract
   của caller; mỗi dispatch vẫn chỉ dùng đúng một backend instance.
7. Một implementation đầu tiên nhỏ vẫn là tập con hợp lệ của contract đích.
```

## claim_44bb41b373e3a877467622c4e64bfbfb

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#32-phi-mục-tiêu; lines 92–92; ancestry ["Spec: Agent Confinement Authority","3. Mục tiêu và phi mục tiêu"].
Target: docs/platform/agent-confinement/spec.md#32-phi-mục-tiêu; ancestry ["Spec: Agent Confinement Authority","3. Mục tiêu và phi mục tiêu"].
Source digest: cdfde5146a65a6fec68998b706feccb15e1f785cee0b79a6338a97bc437a1e18
Target digest: cdfde5146a65a6fec68998b706feccb15e1f785cee0b79a6338a97bc437a1e18
Shown source SHA256: a4eb4fe94f3b70d0998600c0c62f4f7b34d6cb0073a5f1e14a4514429f317a3a
Shown target SHA256: a4eb4fe94f3b70d0998600c0c62f4f7b34d6cb0073a5f1e14a4514429f317a3a

### Complete proposed decision

```json
{
  "claimId": "claim_44bb41b373e3a877467622c4e64bfbfb",
  "sourceUnitDigest": "cdfde5146a65a6fec68998b706feccb15e1f785cee0b79a6338a97bc437a1e18",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "32-phi-mục-tiêu",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/confinement-authority.md#32-phi-mục-tiêu (source lines 92-92) is carried at docs/platform/agent-confinement/spec.md#32-phi-mục-tiêu (candidate lines 114-114). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "cdfde5146a65a6fec68998b706feccb15e1f785cee0b79a6338a97bc437a1e18",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "3. Mục tiêu và phi mục tiêu"
  ]
}
```

### Full source shown text

```text
### 3.2 Phi mục tiêu

- Không chọn executor thay `resolve.mjs`.
- Không biến worktree hay main-checkout lock thành security boundary.
- Không đưa policy theo role/tier vào `assignment-policy.mjs`.
- Không thay contract CLI `decide`/`execute`.
- Không tuyên bố bwrap hiện tại ngăn đọc secret hay network egress.
- Không buộc mọi backend driver phải có cùng một schema cấu hình hay cách
  prepare invocation.
```

### Full target shown text

```text
### 3.2 Phi mục tiêu

- Không chọn executor thay `resolve.mjs`.
- Không biến worktree hay main-checkout lock thành security boundary.
- Không đưa policy theo role/tier vào `assignment-policy.mjs`.
- Không thay contract CLI `decide`/`execute`.
- Không tuyên bố bwrap hiện tại ngăn đọc secret hay network egress.
- Không buộc mọi backend driver phải có cùng một schema cấu hình hay cách
  prepare invocation.
```

## claim_7bc7717a92a34ad4dc50159f7cf1d93f

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-14; lines 94–100; ancestry ["Spec: Agent Confinement Authority","3. Mục tiêu và phi mục tiêu","3.2 Phi mục tiêu"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-16; ancestry ["Spec: Agent Confinement Authority","3. Mục tiêu và phi mục tiêu","3.2 Phi mục tiêu"].
Source digest: 9c04558a540d0fc1dbaaa1b4873972a1a77bc6d49d8fdf13af722161dfa97d72
Target digest: 9c04558a540d0fc1dbaaa1b4873972a1a77bc6d49d8fdf13af722161dfa97d72
Shown source SHA256: 9c04558a540d0fc1dbaaa1b4873972a1a77bc6d49d8fdf13af722161dfa97d72
Shown target SHA256: 9c04558a540d0fc1dbaaa1b4873972a1a77bc6d49d8fdf13af722161dfa97d72

### Complete proposed decision

```json
{
  "claimId": "claim_7bc7717a92a34ad4dc50159f7cf1d93f",
  "sourceUnitDigest": "9c04558a540d0fc1dbaaa1b4873972a1a77bc6d49d8fdf13af722161dfa97d72",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-16",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-14 (source lines 94-100) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-16 (candidate lines 116-122). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "9c04558a540d0fc1dbaaa1b4873972a1a77bc6d49d8fdf13af722161dfa97d72",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "3. Mục tiêu và phi mục tiêu",
    "3.2 Phi mục tiêu"
  ]
}
```

### Full source shown text

```text
- Không chọn executor thay `resolve.mjs`.
- Không biến worktree hay main-checkout lock thành security boundary.
- Không đưa policy theo role/tier vào `assignment-policy.mjs`.
- Không thay contract CLI `decide`/`execute`.
- Không tuyên bố bwrap hiện tại ngăn đọc secret hay network egress.
- Không buộc mọi backend driver phải có cùng một schema cấu hình hay cách
  prepare invocation.
```

### Full target shown text

```text
- Không chọn executor thay `resolve.mjs`.
- Không biến worktree hay main-checkout lock thành security boundary.
- Không đưa policy theo role/tier vào `assignment-policy.mjs`.
- Không thay contract CLI `decide`/`execute`.
- Không tuyên bố bwrap hiện tại ngăn đọc secret hay network egress.
- Không buộc mọi backend driver phải có cùng một schema cấu hình hay cách
  prepare invocation.
```

## claim_ee82a796cb4e8350b49633fc8b827c47

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#33-use-case-đích-và-cách-dùng-mặc-định; lines 102–102; ancestry ["Spec: Agent Confinement Authority","3. Mục tiêu và phi mục tiêu"].
Target: docs/platform/agent-confinement/spec.md#33-use-case-đích-và-cách-dùng-mặc-định; ancestry ["Spec: Agent Confinement Authority","3. Mục tiêu và phi mục tiêu"].
Source digest: 7dc76c05398590e943ab78d13d574f0f66841e659505f94999893ac40caaebe7
Target digest: 7dc76c05398590e943ab78d13d574f0f66841e659505f94999893ac40caaebe7
Shown source SHA256: e14b1896e0f36936d4e50813a18f3ee665c3a51499e04831742f17a0344cf28e
Shown target SHA256: e14b1896e0f36936d4e50813a18f3ee665c3a51499e04831742f17a0344cf28e

### Complete proposed decision

```json
{
  "claimId": "claim_ee82a796cb4e8350b49633fc8b827c47",
  "sourceUnitDigest": "7dc76c05398590e943ab78d13d574f0f66841e659505f94999893ac40caaebe7",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "33-use-case-đích-và-cách-dùng-mặc-định",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole heading unit docs/specs/confinement-authority.md#33-use-case-đích-và-cách-dùng-mặc-định (source lines 102-102) is carried at docs/platform/agent-confinement/spec.md#33-use-case-đích-và-cách-dùng-mặc-định (candidate lines 124-124). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "7dc76c05398590e943ab78d13d574f0f66841e659505f94999893ac40caaebe7",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "3. Mục tiêu và phi mục tiêu"
  ]
}
```

### Full source shown text

```text
### 3.3 Use case đích và cách dùng mặc định

Contract này cần bao phủ ba nhóm use case: agent phân tích/review chỉ được ghi
artifact của dispatch; agent thực hiện thay đổi trong workspace được cấp quyền;
và các executor chạy trên container, máy khác hoặc policy network/secret chặt
hơn. Các use case sau dùng cùng policy, grant và attestation contract; backend
và support matrix quyết định phần nào đã chạy được.

Default implementation phục vụ hai nhóm đầu qua hai policy: workspace read-only
với `host-write-denied`, writable với `workspace-write` theo grant cụ thể;
`run-output` là vùng ghi riêng của dispatch, và private home là vùng tạm do
backend quản lý. Người dùng không cần biết argv hay backend primitive để dùng
default. Setup/doctor phải làm lộ trạng thái registry, prerequisite và probe
freshness theo các registry hiện có; tài liệu này không tự tạo thêm command hay
quy tắc precedence ngoài distribution spec.
```

### Full target shown text

```text
### 3.3 Use case đích và cách dùng mặc định

Contract này cần bao phủ ba nhóm use case: agent phân tích/review chỉ được ghi
artifact của dispatch; agent thực hiện thay đổi trong workspace được cấp quyền;
và các executor chạy trên container, máy khác hoặc policy network/secret chặt
hơn. Các use case sau dùng cùng policy, grant và attestation contract; backend
và support matrix quyết định phần nào đã chạy được.

Default implementation phục vụ hai nhóm đầu qua hai policy: workspace read-only
với `host-write-denied`, writable với `workspace-write` theo grant cụ thể;
`run-output` là vùng ghi riêng của dispatch, và private home là vùng tạm do
backend quản lý. Người dùng không cần biết argv hay backend primitive để dùng
default. Setup/doctor phải làm lộ trạng thái registry, prerequisite và probe
freshness theo các registry hiện có; tài liệu này không tự tạo thêm command hay
quy tắc precedence ngoài distribution spec.
```

## claim_974ab4ff20c3e4ef63805c191e7dec9c

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-15; lines 104–108; ancestry ["Spec: Agent Confinement Authority","3. Mục tiêu và phi mục tiêu","3.3 Use case đích và cách dùng mặc định"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-17; ancestry ["Spec: Agent Confinement Authority","3. Mục tiêu và phi mục tiêu","3.3 Use case đích và cách dùng mặc định"].
Source digest: 0034e87f9be5666d0e95dfc3c4a8f54454f40fe51f7b8891d3ea7fd4f241ed11
Target digest: 0034e87f9be5666d0e95dfc3c4a8f54454f40fe51f7b8891d3ea7fd4f241ed11
Shown source SHA256: 0034e87f9be5666d0e95dfc3c4a8f54454f40fe51f7b8891d3ea7fd4f241ed11
Shown target SHA256: 0034e87f9be5666d0e95dfc3c4a8f54454f40fe51f7b8891d3ea7fd4f241ed11

### Complete proposed decision

```json
{
  "claimId": "claim_974ab4ff20c3e4ef63805c191e7dec9c",
  "sourceUnitDigest": "0034e87f9be5666d0e95dfc3c4a8f54454f40fe51f7b8891d3ea7fd4f241ed11",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-17",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-15 (source lines 104-108) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-17 (candidate lines 126-130). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "0034e87f9be5666d0e95dfc3c4a8f54454f40fe51f7b8891d3ea7fd4f241ed11",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "3. Mục tiêu và phi mục tiêu",
    "3.3 Use case đích và cách dùng mặc định"
  ]
}
```

### Full source shown text

```text
Contract này cần bao phủ ba nhóm use case: agent phân tích/review chỉ được ghi
artifact của dispatch; agent thực hiện thay đổi trong workspace được cấp quyền;
và các executor chạy trên container, máy khác hoặc policy network/secret chặt
hơn. Các use case sau dùng cùng policy, grant và attestation contract; backend
và support matrix quyết định phần nào đã chạy được.
```

### Full target shown text

```text
Contract này cần bao phủ ba nhóm use case: agent phân tích/review chỉ được ghi
artifact của dispatch; agent thực hiện thay đổi trong workspace được cấp quyền;
và các executor chạy trên container, máy khác hoặc policy network/secret chặt
hơn. Các use case sau dùng cùng policy, grant và attestation contract; backend
và support matrix quyết định phần nào đã chạy được.
```

## claim_a73dbba44f9d78cb44cf898ec93bb955

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-16; lines 110–116; ancestry ["Spec: Agent Confinement Authority","3. Mục tiêu và phi mục tiêu","3.3 Use case đích và cách dùng mặc định"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-18; ancestry ["Spec: Agent Confinement Authority","3. Mục tiêu và phi mục tiêu","3.3 Use case đích và cách dùng mặc định"].
Source digest: 779d0248a0709725dc0bd8d0ffdbd4b5257325e259c824143b8c8b79d5d0903d
Target digest: 779d0248a0709725dc0bd8d0ffdbd4b5257325e259c824143b8c8b79d5d0903d
Shown source SHA256: 779d0248a0709725dc0bd8d0ffdbd4b5257325e259c824143b8c8b79d5d0903d
Shown target SHA256: 779d0248a0709725dc0bd8d0ffdbd4b5257325e259c824143b8c8b79d5d0903d

### Complete proposed decision

```json
{
  "claimId": "claim_a73dbba44f9d78cb44cf898ec93bb955",
  "sourceUnitDigest": "779d0248a0709725dc0bd8d0ffdbd4b5257325e259c824143b8c8b79d5d0903d",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-18",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-16 (source lines 110-116) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-18 (candidate lines 132-138). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "779d0248a0709725dc0bd8d0ffdbd4b5257325e259c824143b8c8b79d5d0903d",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "3. Mục tiêu và phi mục tiêu",
    "3.3 Use case đích và cách dùng mặc định"
  ]
}
```

### Full source shown text

```text
Default implementation phục vụ hai nhóm đầu qua hai policy: workspace read-only
với `host-write-denied`, writable với `workspace-write` theo grant cụ thể;
`run-output` là vùng ghi riêng của dispatch, và private home là vùng tạm do
backend quản lý. Người dùng không cần biết argv hay backend primitive để dùng
default. Setup/doctor phải làm lộ trạng thái registry, prerequisite và probe
freshness theo các registry hiện có; tài liệu này không tự tạo thêm command hay
quy tắc precedence ngoài distribution spec.
```

### Full target shown text

```text
Default implementation phục vụ hai nhóm đầu qua hai policy: workspace read-only
với `host-write-denied`, writable với `workspace-write` theo grant cụ thể;
`run-output` là vùng ghi riêng của dispatch, và private home là vùng tạm do
backend quản lý. Người dùng không cần biết argv hay backend primitive để dùng
default. Setup/doctor phải làm lộ trạng thái registry, prerequisite và probe
freshness theo các registry hiện có; tài liệu này không tự tạo thêm command hay
quy tắc precedence ngoài distribution spec.
```

## claim_3357bf4450864c841ccb60bb3d03dcef

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#4-threat-model; lines 118–118; ancestry ["Spec: Agent Confinement Authority"].
Target: docs/platform/agent-confinement/spec.md#4-threat-model; ancestry ["Spec: Agent Confinement Authority"].
Source digest: 03005174fec0d1410da6c08443f52a2de9eb5b0a6b6f3e7c8015749bf627491a
Target digest: 03005174fec0d1410da6c08443f52a2de9eb5b0a6b6f3e7c8015749bf627491a
Shown source SHA256: 70943c8ec76fa1cd5e2c86672524e5eb042489fcd7440ead5e8a187bfa1b3243
Shown target SHA256: 70943c8ec76fa1cd5e2c86672524e5eb042489fcd7440ead5e8a187bfa1b3243

### Complete proposed decision

```json
{
  "claimId": "claim_3357bf4450864c841ccb60bb3d03dcef",
  "sourceUnitDigest": "03005174fec0d1410da6c08443f52a2de9eb5b0a6b6f3e7c8015749bf627491a",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "4-threat-model",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/confinement-authority.md#4-threat-model (source lines 118-118) is carried at docs/platform/agent-confinement/spec.md#4-threat-model (candidate lines 140-140). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "03005174fec0d1410da6c08443f52a2de9eb5b0a6b6f3e7c8015749bf627491a",
  "targetAncestry": [
    "Spec: Agent Confinement Authority"
  ]
}
```

### Full source shown text

```text
## 4. Threat model

Contract diễn tả riêng từng trục. Không có một boolean `confined` chung cho mọi
ý nghĩa.

| Trục | Giá trị chuẩn | Default đầu tiên |
|---|---|---|
| `hostWrite` | `deny` / `allow` | `deny`, trừ các grant được cấp |
| `hostRead` | `deny` / `blind` / `allow` | `allow` |
| `networkEgress` | `deny` / `allow` / `filtered` | `allow` |
| `process` | `isolated` / `host` | `host` |
| `home` | `private` / `host` | `host`; `private` khi policy yêu cầu |
| `session` | `isolated` / `shared` | `shared`; `isolated` khi policy yêu cầu |
| `workspace` | `own` / `shared` | derive từ dispatch context |

session/workspace là context requirement trong policy chung, không phải OS
protection. Authority assess từ trusted dispatch/provisioning evidence rồi hợp
coverage driver. workspace own không tự cấp write grant hay thành sandbox.

Default bwrap đầu tiên chỉ đảm bảo trong cây process được Authority khởi chạy:
**agent không ghi filesystem trực tiếp lên host ngoài các write grant được liệt
kê**, bao gồm ghi qua file descriptor kế thừa. Backend phải đóng hoặc giới hạn
descriptor có thể ghi ngoài grant; không chứng minh được thì coverage hostWrite
là unknown và required refuse. Stdio chỉ được nối tới kênh output do Authority
quản lý, không truyền descriptor ghi file host tùy ý. Tác động gián tiếp qua daemon/service host,
socket của host, credential broker, network peer, hoặc một process được spawn
ngoài sandbox nằm ngoài cam kết `hostWrite` cho đến khi có control riêng và
probe chứng minh. Attestation phải nói rõ các kênh đã được cover và các kênh
ngoài phạm vi. Nó không đảm bảo bí mật không bị đọc, network bị chặn, hay
process namespace được cô lập.

Backend-private scratch (ví dụ tmpfs /tmp) không ghi persistent host filesystem,
không cần host resource grant. Driver phải công bố scratch trong proof profile;
probe được phép ghi ở đó, nhưng phải chứng minh không alias sang host path.
Private home trên host disk vẫn cần grant, khác với scratch tmpfs.

Contract có thể thêm control về secret, network, syscall, CPU/memory và remote
execution sau này mà không đổi nghĩa các control đã có.
```

### Full target shown text

```text
## 4. Threat model

Contract diễn tả riêng từng trục. Không có một boolean `confined` chung cho mọi
ý nghĩa.

| Trục | Giá trị chuẩn | Default đầu tiên |
|---|---|---|
| `hostWrite` | `deny` / `allow` | `deny`, trừ các grant được cấp |
| `hostRead` | `deny` / `blind` / `allow` | `allow` |
| `networkEgress` | `deny` / `allow` / `filtered` | `allow` |
| `process` | `isolated` / `host` | `host` |
| `home` | `private` / `host` | `host`; `private` khi policy yêu cầu |
| `session` | `isolated` / `shared` | `shared`; `isolated` khi policy yêu cầu |
| `workspace` | `own` / `shared` | derive từ dispatch context |

session/workspace là context requirement trong policy chung, không phải OS
protection. Authority assess từ trusted dispatch/provisioning evidence rồi hợp
coverage driver. workspace own không tự cấp write grant hay thành sandbox.

Default bwrap đầu tiên chỉ đảm bảo trong cây process được Authority khởi chạy:
**agent không ghi filesystem trực tiếp lên host ngoài các write grant được liệt
kê**, bao gồm ghi qua file descriptor kế thừa. Backend phải đóng hoặc giới hạn
descriptor có thể ghi ngoài grant; không chứng minh được thì coverage hostWrite
là unknown và required refuse. Stdio chỉ được nối tới kênh output do Authority
quản lý, không truyền descriptor ghi file host tùy ý. Tác động gián tiếp qua daemon/service host,
socket của host, credential broker, network peer, hoặc một process được spawn
ngoài sandbox nằm ngoài cam kết `hostWrite` cho đến khi có control riêng và
probe chứng minh. Attestation phải nói rõ các kênh đã được cover và các kênh
ngoài phạm vi. Nó không đảm bảo bí mật không bị đọc, network bị chặn, hay
process namespace được cô lập.

Backend-private scratch (ví dụ tmpfs /tmp) không ghi persistent host filesystem,
không cần host resource grant. Driver phải công bố scratch trong proof profile;
probe được phép ghi ở đó, nhưng phải chứng minh không alias sang host path.
Private home trên host disk vẫn cần grant, khác với scratch tmpfs.

Contract có thể thêm control về secret, network, syscall, CPU/memory và remote
execution sau này mà không đổi nghĩa các control đã có.
```

## claim_9235033a167934865ae9528d85596b9d

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-17; lines 120–121; ancestry ["Spec: Agent Confinement Authority","4. Threat model"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-19; ancestry ["Spec: Agent Confinement Authority","4. Threat model"].
Source digest: fbe04ecca29a8fc82519684dcfead7d2c94adcdb68ceaa637dbd5845b5e83033
Target digest: fbe04ecca29a8fc82519684dcfead7d2c94adcdb68ceaa637dbd5845b5e83033
Shown source SHA256: fbe04ecca29a8fc82519684dcfead7d2c94adcdb68ceaa637dbd5845b5e83033
Shown target SHA256: fbe04ecca29a8fc82519684dcfead7d2c94adcdb68ceaa637dbd5845b5e83033

### Complete proposed decision

```json
{
  "claimId": "claim_9235033a167934865ae9528d85596b9d",
  "sourceUnitDigest": "fbe04ecca29a8fc82519684dcfead7d2c94adcdb68ceaa637dbd5845b5e83033",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-19",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-17 (source lines 120-121) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-19 (candidate lines 142-143). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "fbe04ecca29a8fc82519684dcfead7d2c94adcdb68ceaa637dbd5845b5e83033",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "4. Threat model"
  ]
}
```

### Full source shown text

```text
Contract diễn tả riêng từng trục. Không có một boolean `confined` chung cho mọi
ý nghĩa.
```

### Full target shown text

```text
Contract diễn tả riêng từng trục. Không có một boolean `confined` chung cho mọi
ý nghĩa.
```

## claim_261fd234537163e9c306c0990de2cccb

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-18; lines 123–131; ancestry ["Spec: Agent Confinement Authority","4. Threat model"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-20; ancestry ["Spec: Agent Confinement Authority","4. Threat model"].
Source digest: b1dd0ead1405bd4a8e01cf9358cba6b084ef835b43f78f550012d05cdf3ff002
Target digest: b1dd0ead1405bd4a8e01cf9358cba6b084ef835b43f78f550012d05cdf3ff002
Shown source SHA256: b1dd0ead1405bd4a8e01cf9358cba6b084ef835b43f78f550012d05cdf3ff002
Shown target SHA256: b1dd0ead1405bd4a8e01cf9358cba6b084ef835b43f78f550012d05cdf3ff002

### Complete proposed decision

```json
{
  "claimId": "claim_261fd234537163e9c306c0990de2cccb",
  "sourceUnitDigest": "b1dd0ead1405bd4a8e01cf9358cba6b084ef835b43f78f550012d05cdf3ff002",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-20",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-18 (source lines 123-131) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-20 (candidate lines 145-153). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "b1dd0ead1405bd4a8e01cf9358cba6b084ef835b43f78f550012d05cdf3ff002",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "4. Threat model"
  ]
}
```

### Full source shown text

```text
| Trục | Giá trị chuẩn | Default đầu tiên |
|---|---|---|
| `hostWrite` | `deny` / `allow` | `deny`, trừ các grant được cấp |
| `hostRead` | `deny` / `blind` / `allow` | `allow` |
| `networkEgress` | `deny` / `allow` / `filtered` | `allow` |
| `process` | `isolated` / `host` | `host` |
| `home` | `private` / `host` | `host`; `private` khi policy yêu cầu |
| `session` | `isolated` / `shared` | `shared`; `isolated` khi policy yêu cầu |
| `workspace` | `own` / `shared` | derive từ dispatch context |
```

### Full target shown text

```text
| Trục | Giá trị chuẩn | Default đầu tiên |
|---|---|---|
| `hostWrite` | `deny` / `allow` | `deny`, trừ các grant được cấp |
| `hostRead` | `deny` / `blind` / `allow` | `allow` |
| `networkEgress` | `deny` / `allow` / `filtered` | `allow` |
| `process` | `isolated` / `host` | `host` |
| `home` | `private` / `host` | `host`; `private` khi policy yêu cầu |
| `session` | `isolated` / `shared` | `shared`; `isolated` khi policy yêu cầu |
| `workspace` | `own` / `shared` | derive từ dispatch context |
```

## claim_b9193c06d7a58f44eb151b6b730668bb

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-19; lines 133–135; ancestry ["Spec: Agent Confinement Authority","4. Threat model"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-21; ancestry ["Spec: Agent Confinement Authority","4. Threat model"].
Source digest: 50350bcfe22e57e77360aad5d1e994053801f7d59e47c1d83ed9c602253b3ecd
Target digest: 50350bcfe22e57e77360aad5d1e994053801f7d59e47c1d83ed9c602253b3ecd
Shown source SHA256: 50350bcfe22e57e77360aad5d1e994053801f7d59e47c1d83ed9c602253b3ecd
Shown target SHA256: 50350bcfe22e57e77360aad5d1e994053801f7d59e47c1d83ed9c602253b3ecd

### Complete proposed decision

```json
{
  "claimId": "claim_b9193c06d7a58f44eb151b6b730668bb",
  "sourceUnitDigest": "50350bcfe22e57e77360aad5d1e994053801f7d59e47c1d83ed9c602253b3ecd",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-21",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-19 (source lines 133-135) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-21 (candidate lines 155-157). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "50350bcfe22e57e77360aad5d1e994053801f7d59e47c1d83ed9c602253b3ecd",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "4. Threat model"
  ]
}
```

### Full source shown text

```text
session/workspace là context requirement trong policy chung, không phải OS
protection. Authority assess từ trusted dispatch/provisioning evidence rồi hợp
coverage driver. workspace own không tự cấp write grant hay thành sandbox.
```

### Full target shown text

```text
session/workspace là context requirement trong policy chung, không phải OS
protection. Authority assess từ trusted dispatch/provisioning evidence rồi hợp
coverage driver. workspace own không tự cấp write grant hay thành sandbox.
```

## claim_6ae075930d08b33b19fa26d11dddbb7e

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-20; lines 137–147; ancestry ["Spec: Agent Confinement Authority","4. Threat model"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-22; ancestry ["Spec: Agent Confinement Authority","4. Threat model"].
Source digest: 82a9fc630b06efc1ff9160ddf99d1ef14782fc3bc60922926371aff69b9ca768
Target digest: 82a9fc630b06efc1ff9160ddf99d1ef14782fc3bc60922926371aff69b9ca768
Shown source SHA256: 82a9fc630b06efc1ff9160ddf99d1ef14782fc3bc60922926371aff69b9ca768
Shown target SHA256: 82a9fc630b06efc1ff9160ddf99d1ef14782fc3bc60922926371aff69b9ca768

### Complete proposed decision

```json
{
  "claimId": "claim_6ae075930d08b33b19fa26d11dddbb7e",
  "sourceUnitDigest": "82a9fc630b06efc1ff9160ddf99d1ef14782fc3bc60922926371aff69b9ca768",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-22",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-20 (source lines 137-147) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-22 (candidate lines 159-169). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "82a9fc630b06efc1ff9160ddf99d1ef14782fc3bc60922926371aff69b9ca768",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "4. Threat model"
  ]
}
```

### Full source shown text

```text
Default bwrap đầu tiên chỉ đảm bảo trong cây process được Authority khởi chạy:
**agent không ghi filesystem trực tiếp lên host ngoài các write grant được liệt
kê**, bao gồm ghi qua file descriptor kế thừa. Backend phải đóng hoặc giới hạn
descriptor có thể ghi ngoài grant; không chứng minh được thì coverage hostWrite
là unknown và required refuse. Stdio chỉ được nối tới kênh output do Authority
quản lý, không truyền descriptor ghi file host tùy ý. Tác động gián tiếp qua daemon/service host,
socket của host, credential broker, network peer, hoặc một process được spawn
ngoài sandbox nằm ngoài cam kết `hostWrite` cho đến khi có control riêng và
probe chứng minh. Attestation phải nói rõ các kênh đã được cover và các kênh
ngoài phạm vi. Nó không đảm bảo bí mật không bị đọc, network bị chặn, hay
process namespace được cô lập.
```

### Full target shown text

```text
Default bwrap đầu tiên chỉ đảm bảo trong cây process được Authority khởi chạy:
**agent không ghi filesystem trực tiếp lên host ngoài các write grant được liệt
kê**, bao gồm ghi qua file descriptor kế thừa. Backend phải đóng hoặc giới hạn
descriptor có thể ghi ngoài grant; không chứng minh được thì coverage hostWrite
là unknown và required refuse. Stdio chỉ được nối tới kênh output do Authority
quản lý, không truyền descriptor ghi file host tùy ý. Tác động gián tiếp qua daemon/service host,
socket của host, credential broker, network peer, hoặc một process được spawn
ngoài sandbox nằm ngoài cam kết `hostWrite` cho đến khi có control riêng và
probe chứng minh. Attestation phải nói rõ các kênh đã được cover và các kênh
ngoài phạm vi. Nó không đảm bảo bí mật không bị đọc, network bị chặn, hay
process namespace được cô lập.
```

## claim_1720c1e2b7546fb9abc46f977dca5825

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-21; lines 149–152; ancestry ["Spec: Agent Confinement Authority","4. Threat model"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-23; ancestry ["Spec: Agent Confinement Authority","4. Threat model"].
Source digest: 58de682e70a5457522892e8231fb6d7cf5c71ba825b60d0b16e3386248a8156b
Target digest: 58de682e70a5457522892e8231fb6d7cf5c71ba825b60d0b16e3386248a8156b
Shown source SHA256: 58de682e70a5457522892e8231fb6d7cf5c71ba825b60d0b16e3386248a8156b
Shown target SHA256: 58de682e70a5457522892e8231fb6d7cf5c71ba825b60d0b16e3386248a8156b

### Complete proposed decision

```json
{
  "claimId": "claim_1720c1e2b7546fb9abc46f977dca5825",
  "sourceUnitDigest": "58de682e70a5457522892e8231fb6d7cf5c71ba825b60d0b16e3386248a8156b",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-23",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-21 (source lines 149-152) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-23 (candidate lines 171-174). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "58de682e70a5457522892e8231fb6d7cf5c71ba825b60d0b16e3386248a8156b",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "4. Threat model"
  ]
}
```

### Full source shown text

```text
Backend-private scratch (ví dụ tmpfs /tmp) không ghi persistent host filesystem,
không cần host resource grant. Driver phải công bố scratch trong proof profile;
probe được phép ghi ở đó, nhưng phải chứng minh không alias sang host path.
Private home trên host disk vẫn cần grant, khác với scratch tmpfs.
```

### Full target shown text

```text
Backend-private scratch (ví dụ tmpfs /tmp) không ghi persistent host filesystem,
không cần host resource grant. Driver phải công bố scratch trong proof profile;
probe được phép ghi ở đó, nhưng phải chứng minh không alias sang host path.
Private home trên host disk vẫn cần grant, khác với scratch tmpfs.
```

## claim_579b1a0a3f1da1f0dd4b7cf68df7296c

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-22; lines 154–155; ancestry ["Spec: Agent Confinement Authority","4. Threat model"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-24; ancestry ["Spec: Agent Confinement Authority","4. Threat model"].
Source digest: be716ac2e12a5034e40af648c86c875e85a8959bbc8b36fdb5767121bd29460b
Target digest: be716ac2e12a5034e40af648c86c875e85a8959bbc8b36fdb5767121bd29460b
Shown source SHA256: be716ac2e12a5034e40af648c86c875e85a8959bbc8b36fdb5767121bd29460b
Shown target SHA256: be716ac2e12a5034e40af648c86c875e85a8959bbc8b36fdb5767121bd29460b

### Complete proposed decision

```json
{
  "claimId": "claim_579b1a0a3f1da1f0dd4b7cf68df7296c",
  "sourceUnitDigest": "be716ac2e12a5034e40af648c86c875e85a8959bbc8b36fdb5767121bd29460b",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-24",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-22 (source lines 154-155) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-24 (candidate lines 176-177). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "be716ac2e12a5034e40af648c86c875e85a8959bbc8b36fdb5767121bd29460b",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "4. Threat model"
  ]
}
```

### Full source shown text

```text
Contract có thể thêm control về secret, network, syscall, CPU/memory và remote
execution sau này mà không đổi nghĩa các control đã có.
```

### Full target shown text

```text
Contract có thể thêm control về secret, network, syscall, CPU/memory và remote
execution sau này mà không đổi nghĩa các control đã có.
```

## claim_d4f22adcf76f556e71fd4b571c65fd02

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#5-component-boundary; lines 157–157; ancestry ["Spec: Agent Confinement Authority"].
Target: docs/platform/agent-confinement/spec.md#5-component-boundary; ancestry ["Spec: Agent Confinement Authority"].
Source digest: bd8e4286da3b9be7ecca63ef6997d223b301f60c28afc8a6a5917091e7e46241
Target digest: bd8e4286da3b9be7ecca63ef6997d223b301f60c28afc8a6a5917091e7e46241
Shown source SHA256: b6ddbd37ce34d91a739b3923d725aa1f85ec680fb816b7e86dd1c75c8c1e51c1
Shown target SHA256: b6ddbd37ce34d91a739b3923d725aa1f85ec680fb816b7e86dd1c75c8c1e51c1

### Complete proposed decision

```json
{
  "claimId": "claim_d4f22adcf76f556e71fd4b571c65fd02",
  "sourceUnitDigest": "bd8e4286da3b9be7ecca63ef6997d223b301f60c28afc8a6a5917091e7e46241",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "5-component-boundary",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/confinement-authority.md#5-component-boundary (source lines 157-157) is carried at docs/platform/agent-confinement/spec.md#5-component-boundary (candidate lines 179-179). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "bd8e4286da3b9be7ecca63ef6997d223b301f60c28afc8a6a5917091e7e46241",
  "targetAncestry": [
    "Spec: Agent Confinement Authority"
  ]
}
```

### Full source shown text

```text
## 5. Component boundary
```

### Full target shown text

```text
## 5. Component boundary
```

## claim_f083b4f83f01dbdb32c7cd11aa57f872

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#51-vị-trí-và-parent; lines 159–159; ancestry ["Spec: Agent Confinement Authority","5. Component boundary"].
Target: docs/platform/agent-confinement/spec.md#51-vị-trí-và-parent; ancestry ["Spec: Agent Confinement Authority","5. Component boundary"].
Source digest: 1f7803f54ad8e97373ec11ddaf6f2c0c4e4b1217eacd9059e9008ca69bdaed10
Target digest: 1f7803f54ad8e97373ec11ddaf6f2c0c4e4b1217eacd9059e9008ca69bdaed10
Shown source SHA256: b6610a6be03e376248f65d0ff6f18f2acb5fab25a3eca6122f2bbeacb36d22e0
Shown target SHA256: b6610a6be03e376248f65d0ff6f18f2acb5fab25a3eca6122f2bbeacb36d22e0

### Complete proposed decision

```json
{
  "claimId": "claim_f083b4f83f01dbdb32c7cd11aa57f872",
  "sourceUnitDigest": "1f7803f54ad8e97373ec11ddaf6f2c0c4e4b1217eacd9059e9008ca69bdaed10",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "51-vị-trí-và-parent",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/confinement-authority.md#51-vị-trí-và-parent (source lines 159-159) is carried at docs/platform/agent-confinement/spec.md#51-vị-trí-và-parent (candidate lines 181-181). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "1f7803f54ad8e97373ec11ddaf6f2c0c4e4b1217eacd9059e9008ca69bdaed10",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "5. Component boundary"
  ]
}
```

### Full source shown text

```text
### 5.1 Vị trí và parent

Component dự kiến sống tại `src/runner/dispatch/confinement/`, là component con
của dispatch Infra. Facade `src/runner/dispatch.mjs` công bố cửa runtime; caller
không import backend hay adapter execute function trực tiếp.

Agent Confinement Authority sở hữu:

- normalize và validate confinement policy;
- so minimum requirement với năng lực backend, không cho phép hạ policy;
- resolve resource grant thành path/runtime handle cụ thể;
- resolve backend instance mà executor đã chọn qua registry cấu hình;
- compile một `ConfinementPlan` bất biến;
- prepare invocation/context cho adapter;
- validate resource binding rồi giao resolved binding cho backend driver; driver
  materialize sandbox invocation từ binding đã được duyệt;
- gọi đúng một adapter qua `adapterPort`;
- phát attestation trước/sau execution và cleanup resource tạm;
- từ chối trước spawn khi requirement không thể đáp ứng.

Agent Confinement Authority không sở hữu:

- chọn capability, executor hoặc model;
- tạo worktree hay quyết định assignment;
- nội dung prompt;
- lifecycle state của work item;
- implementation của từng executor adapter;
- probe độc lập dùng để falsify backend.
```

### Full target shown text

```text
### 5.1 Vị trí và parent

Component dự kiến sống tại `src/runner/dispatch/confinement/`, là component con
của dispatch Infra. Facade `src/runner/dispatch.mjs` công bố cửa runtime; caller
không import backend hay adapter execute function trực tiếp.

Agent Confinement Authority sở hữu:

- normalize và validate confinement policy;
- so minimum requirement với năng lực backend, không cho phép hạ policy;
- resolve resource grant thành path/runtime handle cụ thể;
- resolve backend instance mà executor đã chọn qua registry cấu hình;
- compile một `ConfinementPlan` bất biến;
- prepare invocation/context cho adapter;
- validate resource binding rồi giao resolved binding cho backend driver; driver
  materialize sandbox invocation từ binding đã được duyệt;
- gọi đúng một adapter qua `adapterPort`;
- phát attestation trước/sau execution và cleanup resource tạm;
- từ chối trước spawn khi requirement không thể đáp ứng.

Agent Confinement Authority không sở hữu:

- chọn capability, executor hoặc model;
- tạo worktree hay quyết định assignment;
- nội dung prompt;
- lifecycle state của work item;
- implementation của từng executor adapter;
- probe độc lập dùng để falsify backend.
```

## claim_35b15d0934b7b00d4dc499e636e5454a

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-23; lines 161–163; ancestry ["Spec: Agent Confinement Authority","5. Component boundary","5.1 Vị trí và parent"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-25; ancestry ["Spec: Agent Confinement Authority","5. Component boundary","5.1 Vị trí và parent"].
Source digest: 75fcceade6aa085b470fe340ea5938c62fb80e1f413bf4a9833fe96eb305dc0b
Target digest: 75fcceade6aa085b470fe340ea5938c62fb80e1f413bf4a9833fe96eb305dc0b
Shown source SHA256: 75fcceade6aa085b470fe340ea5938c62fb80e1f413bf4a9833fe96eb305dc0b
Shown target SHA256: 75fcceade6aa085b470fe340ea5938c62fb80e1f413bf4a9833fe96eb305dc0b

### Complete proposed decision

```json
{
  "claimId": "claim_35b15d0934b7b00d4dc499e636e5454a",
  "sourceUnitDigest": "75fcceade6aa085b470fe340ea5938c62fb80e1f413bf4a9833fe96eb305dc0b",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-25",
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-23 (source lines 161-163) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-25 (candidate lines 183-185). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "75fcceade6aa085b470fe340ea5938c62fb80e1f413bf4a9833fe96eb305dc0b",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "5. Component boundary",
    "5.1 Vị trí và parent"
  ]
}
```

### Full source shown text

```text
Component dự kiến sống tại `src/runner/dispatch/confinement/`, là component con
của dispatch Infra. Facade `src/runner/dispatch.mjs` công bố cửa runtime; caller
không import backend hay adapter execute function trực tiếp.
```

### Full target shown text

```text
Component dự kiến sống tại `src/runner/dispatch/confinement/`, là component con
của dispatch Infra. Facade `src/runner/dispatch.mjs` công bố cửa runtime; caller
không import backend hay adapter execute function trực tiếp.
```

## claim_3f9830e586c476dd28ffdb5e32b6ec72

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-24; lines 165–165; ancestry ["Spec: Agent Confinement Authority","5. Component boundary","5.1 Vị trí và parent"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-26; ancestry ["Spec: Agent Confinement Authority","5. Component boundary","5.1 Vị trí và parent"].
Source digest: c197e2049c5a07656d02143a56b987482fd5eb433e461694a1c11ad171d736ff
Target digest: c197e2049c5a07656d02143a56b987482fd5eb433e461694a1c11ad171d736ff
Shown source SHA256: c197e2049c5a07656d02143a56b987482fd5eb433e461694a1c11ad171d736ff
Shown target SHA256: c197e2049c5a07656d02143a56b987482fd5eb433e461694a1c11ad171d736ff

### Complete proposed decision

```json
{
  "claimId": "claim_3f9830e586c476dd28ffdb5e32b6ec72",
  "sourceUnitDigest": "c197e2049c5a07656d02143a56b987482fd5eb433e461694a1c11ad171d736ff",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-26",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-24 (source lines 165-165) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-26 (candidate lines 187-187). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "c197e2049c5a07656d02143a56b987482fd5eb433e461694a1c11ad171d736ff",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "5. Component boundary",
    "5.1 Vị trí và parent"
  ]
}
```

### Full source shown text

```text
Agent Confinement Authority sở hữu:
```

### Full target shown text

```text
Agent Confinement Authority sở hữu:
```

## claim_f720709d19fbec377b1da6118d3017e1

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-25; lines 167–177; ancestry ["Spec: Agent Confinement Authority","5. Component boundary","5.1 Vị trí và parent"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-27; ancestry ["Spec: Agent Confinement Authority","5. Component boundary","5.1 Vị trí và parent"].
Source digest: ae3e82541e20bbf22e7804f3cb3fcdc42582b93303a71e221acf99a6fec61522
Target digest: ae3e82541e20bbf22e7804f3cb3fcdc42582b93303a71e221acf99a6fec61522
Shown source SHA256: ae3e82541e20bbf22e7804f3cb3fcdc42582b93303a71e221acf99a6fec61522
Shown target SHA256: ae3e82541e20bbf22e7804f3cb3fcdc42582b93303a71e221acf99a6fec61522

### Complete proposed decision

```json
{
  "claimId": "claim_f720709d19fbec377b1da6118d3017e1",
  "sourceUnitDigest": "ae3e82541e20bbf22e7804f3cb3fcdc42582b93303a71e221acf99a6fec61522",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-27",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-25 (source lines 167-177) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-27 (candidate lines 189-199). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "ae3e82541e20bbf22e7804f3cb3fcdc42582b93303a71e221acf99a6fec61522",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "5. Component boundary",
    "5.1 Vị trí và parent"
  ]
}
```

### Full source shown text

```text
- normalize và validate confinement policy;
- so minimum requirement với năng lực backend, không cho phép hạ policy;
- resolve resource grant thành path/runtime handle cụ thể;
- resolve backend instance mà executor đã chọn qua registry cấu hình;
- compile một `ConfinementPlan` bất biến;
- prepare invocation/context cho adapter;
- validate resource binding rồi giao resolved binding cho backend driver; driver
  materialize sandbox invocation từ binding đã được duyệt;
- gọi đúng một adapter qua `adapterPort`;
- phát attestation trước/sau execution và cleanup resource tạm;
- từ chối trước spawn khi requirement không thể đáp ứng.
```

### Full target shown text

```text
- normalize và validate confinement policy;
- so minimum requirement với năng lực backend, không cho phép hạ policy;
- resolve resource grant thành path/runtime handle cụ thể;
- resolve backend instance mà executor đã chọn qua registry cấu hình;
- compile một `ConfinementPlan` bất biến;
- prepare invocation/context cho adapter;
- validate resource binding rồi giao resolved binding cho backend driver; driver
  materialize sandbox invocation từ binding đã được duyệt;
- gọi đúng một adapter qua `adapterPort`;
- phát attestation trước/sau execution và cleanup resource tạm;
- từ chối trước spawn khi requirement không thể đáp ứng.
```

## claim_8c0f0587e917eb027f7904f9d2ec5ab1

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-26; lines 179–179; ancestry ["Spec: Agent Confinement Authority","5. Component boundary","5.1 Vị trí và parent"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-28; ancestry ["Spec: Agent Confinement Authority","5. Component boundary","5.1 Vị trí và parent"].
Source digest: 696474a359edf32d98a7cc86a8e42e841414dc3c40437ceeb67fe94a80f21163
Target digest: 696474a359edf32d98a7cc86a8e42e841414dc3c40437ceeb67fe94a80f21163
Shown source SHA256: 696474a359edf32d98a7cc86a8e42e841414dc3c40437ceeb67fe94a80f21163
Shown target SHA256: 696474a359edf32d98a7cc86a8e42e841414dc3c40437ceeb67fe94a80f21163

### Complete proposed decision

```json
{
  "claimId": "claim_8c0f0587e917eb027f7904f9d2ec5ab1",
  "sourceUnitDigest": "696474a359edf32d98a7cc86a8e42e841414dc3c40437ceeb67fe94a80f21163",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-28",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-26 (source lines 179-179) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-28 (candidate lines 201-201). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "696474a359edf32d98a7cc86a8e42e841414dc3c40437ceeb67fe94a80f21163",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "5. Component boundary",
    "5.1 Vị trí và parent"
  ]
}
```

### Full source shown text

```text
Agent Confinement Authority không sở hữu:
```

### Full target shown text

```text
Agent Confinement Authority không sở hữu:
```

## claim_1818fed994fc49f9c1084ae57df27a01

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-27; lines 181–186; ancestry ["Spec: Agent Confinement Authority","5. Component boundary","5.1 Vị trí và parent"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-29; ancestry ["Spec: Agent Confinement Authority","5. Component boundary","5.1 Vị trí và parent"].
Source digest: 12b7882b372d729494e050cc316c0dfc77f753c58d110032331e9d26b9aaff97
Target digest: 12b7882b372d729494e050cc316c0dfc77f753c58d110032331e9d26b9aaff97
Shown source SHA256: 12b7882b372d729494e050cc316c0dfc77f753c58d110032331e9d26b9aaff97
Shown target SHA256: 12b7882b372d729494e050cc316c0dfc77f753c58d110032331e9d26b9aaff97

### Complete proposed decision

```json
{
  "claimId": "claim_1818fed994fc49f9c1084ae57df27a01",
  "sourceUnitDigest": "12b7882b372d729494e050cc316c0dfc77f753c58d110032331e9d26b9aaff97",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-29",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-27 (source lines 181-186) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-29 (candidate lines 203-208). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "12b7882b372d729494e050cc316c0dfc77f753c58d110032331e9d26b9aaff97",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "5. Component boundary",
    "5.1 Vị trí và parent"
  ]
}
```

### Full source shown text

```text
- chọn capability, executor hoặc model;
- tạo worktree hay quyết định assignment;
- nội dung prompt;
- lifecycle state của work item;
- implementation của từng executor adapter;
- probe độc lập dùng để falsify backend.
```

### Full target shown text

```text
- chọn capability, executor hoặc model;
- tạo worktree hay quyết định assignment;
- nội dung prompt;
- lifecycle state của work item;
- implementation của từng executor adapter;
- probe độc lập dùng để falsify backend.
```

## claim_42c16b046b463e8a2aea19bbd55e284c

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#52-quy-tắc-dependency; lines 188–188; ancestry ["Spec: Agent Confinement Authority","5. Component boundary"].
Target: docs/platform/agent-confinement/spec.md#52-quy-tắc-dependency; ancestry ["Spec: Agent Confinement Authority","5. Component boundary"].
Source digest: 12f929a888d5b3bdf3a8e7a1509877484be9590833fdebce0277c0e6e7d228b9
Target digest: 12f929a888d5b3bdf3a8e7a1509877484be9590833fdebce0277c0e6e7d228b9
Shown source SHA256: 0d42acf230497d08fb2833d10a56a2cf036aefafe9d6e0eda6376e9de5d55895
Shown target SHA256: 0d42acf230497d08fb2833d10a56a2cf036aefafe9d6e0eda6376e9de5d55895

### Complete proposed decision

```json
{
  "claimId": "claim_42c16b046b463e8a2aea19bbd55e284c",
  "sourceUnitDigest": "12f929a888d5b3bdf3a8e7a1509877484be9590833fdebce0277c0e6e7d228b9",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "52-quy-tắc-dependency",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/confinement-authority.md#52-quy-tắc-dependency (source lines 188-188) is carried at docs/platform/agent-confinement/spec.md#52-quy-tắc-dependency (candidate lines 210-210). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "12f929a888d5b3bdf3a8e7a1509877484be9590833fdebce0277c0e6e7d228b9",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "5. Component boundary"
  ]
}
```

### Full source shown text

```text
### 5.2 Quy tắc dependency

1. Hai đường trong `dispatch/cli.mjs` resolve executor như hiện tại.
2. Mỗi đường tạo hoặc nhận `runDir` trước.
3. Mỗi đường gọi cùng `executeThroughConfinement`.
4. Chỉ Agent Confinement Authority tra adapter execute function từ registry và gọi nó.
5. Config validator chỉ đọc metadata registry, không nắm execute handle.
6. Backend không được tự spawn agent. Backend chỉ prepare guarded invocation và
   lifecycle cleanup; Authority vẫn giữ quyền execute.

Quy tắc 4 và 6 làm cho “một cửa” kiểm được bằng code, không chỉ là cách gọi tên.
`adapterPort` là execute handle do Authority nhận từ registry tin cậy của
process dispatch; caller không được tự truyền implementation hoặc đổi handle
sau khi plan đã compile.

Adapter metadata có `locus: local-process | remote`. cli-spawn/herdr-spawn là
local-process; http là remote dù request được gửi từ host. Bwrap chỉ nhận
local-process, không coi việc bọc HTTP client là confine remote agent.
In-process Agent/Task tool nằm ngoài execution authority này: dispatch ghi
`authorityScope: external-harness`, attestation null, không gọi đó là unconfined.
Capability required không được dispatch in-process khi chưa có trusted harness
attestation contract đáp ứng policy; phải refuse thay vì bỏ requirement.
```

### Full target shown text

```text
### 5.2 Quy tắc dependency

1. Hai đường trong `dispatch/cli.mjs` resolve executor như hiện tại.
2. Mỗi đường tạo hoặc nhận `runDir` trước.
3. Mỗi đường gọi cùng `executeThroughConfinement`.
4. Chỉ Agent Confinement Authority tra adapter execute function từ registry và gọi nó.
5. Config validator chỉ đọc metadata registry, không nắm execute handle.
6. Backend không được tự spawn agent. Backend chỉ prepare guarded invocation và
   lifecycle cleanup; Authority vẫn giữ quyền execute.

Quy tắc 4 và 6 làm cho “một cửa” kiểm được bằng code, không chỉ là cách gọi tên.
`adapterPort` là execute handle do Authority nhận từ registry tin cậy của
process dispatch; caller không được tự truyền implementation hoặc đổi handle
sau khi plan đã compile.

Adapter metadata có `locus: local-process | remote`. cli-spawn/herdr-spawn là
local-process; http là remote dù request được gửi từ host. Bwrap chỉ nhận
local-process, không coi việc bọc HTTP client là confine remote agent.
In-process Agent/Task tool nằm ngoài execution authority này: dispatch ghi
`authorityScope: external-harness`, attestation null, không gọi đó là unconfined.
Capability required không được dispatch in-process khi chưa có trusted harness
attestation contract đáp ứng policy; phải refuse thay vì bỏ requirement.
```

## claim_467d37a7c682201f64cf45145bb77633

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-28; lines 190–196; ancestry ["Spec: Agent Confinement Authority","5. Component boundary","5.2 Quy tắc dependency"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-30; ancestry ["Spec: Agent Confinement Authority","5. Component boundary","5.2 Quy tắc dependency"].
Source digest: 9e8799eecd7d7c8646a012459732c22b9ab75b0b66923b1de2c4e72edfcf65e6
Target digest: 9e8799eecd7d7c8646a012459732c22b9ab75b0b66923b1de2c4e72edfcf65e6
Shown source SHA256: 9e8799eecd7d7c8646a012459732c22b9ab75b0b66923b1de2c4e72edfcf65e6
Shown target SHA256: 9e8799eecd7d7c8646a012459732c22b9ab75b0b66923b1de2c4e72edfcf65e6

### Complete proposed decision

```json
{
  "claimId": "claim_467d37a7c682201f64cf45145bb77633",
  "sourceUnitDigest": "9e8799eecd7d7c8646a012459732c22b9ab75b0b66923b1de2c4e72edfcf65e6",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-30",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-28 (source lines 190-196) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-30 (candidate lines 212-218). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "9e8799eecd7d7c8646a012459732c22b9ab75b0b66923b1de2c4e72edfcf65e6",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "5. Component boundary",
    "5.2 Quy tắc dependency"
  ]
}
```

### Full source shown text

```text
1. Hai đường trong `dispatch/cli.mjs` resolve executor như hiện tại.
2. Mỗi đường tạo hoặc nhận `runDir` trước.
3. Mỗi đường gọi cùng `executeThroughConfinement`.
4. Chỉ Agent Confinement Authority tra adapter execute function từ registry và gọi nó.
5. Config validator chỉ đọc metadata registry, không nắm execute handle.
6. Backend không được tự spawn agent. Backend chỉ prepare guarded invocation và
   lifecycle cleanup; Authority vẫn giữ quyền execute.
```

### Full target shown text

```text
1. Hai đường trong `dispatch/cli.mjs` resolve executor như hiện tại.
2. Mỗi đường tạo hoặc nhận `runDir` trước.
3. Mỗi đường gọi cùng `executeThroughConfinement`.
4. Chỉ Agent Confinement Authority tra adapter execute function từ registry và gọi nó.
5. Config validator chỉ đọc metadata registry, không nắm execute handle.
6. Backend không được tự spawn agent. Backend chỉ prepare guarded invocation và
   lifecycle cleanup; Authority vẫn giữ quyền execute.
```

## claim_8986987d4027a2f84a4b4c69fc636ac8

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-29; lines 198–201; ancestry ["Spec: Agent Confinement Authority","5. Component boundary","5.2 Quy tắc dependency"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-31; ancestry ["Spec: Agent Confinement Authority","5. Component boundary","5.2 Quy tắc dependency"].
Source digest: 20d9856cf018fb4ea9d199a3f2d18b6256ac6e69242dee66192a5722319c5f1f
Target digest: 20d9856cf018fb4ea9d199a3f2d18b6256ac6e69242dee66192a5722319c5f1f
Shown source SHA256: 20d9856cf018fb4ea9d199a3f2d18b6256ac6e69242dee66192a5722319c5f1f
Shown target SHA256: 20d9856cf018fb4ea9d199a3f2d18b6256ac6e69242dee66192a5722319c5f1f

### Complete proposed decision

```json
{
  "claimId": "claim_8986987d4027a2f84a4b4c69fc636ac8",
  "sourceUnitDigest": "20d9856cf018fb4ea9d199a3f2d18b6256ac6e69242dee66192a5722319c5f1f",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-31",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-29 (source lines 198-201) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-31 (candidate lines 220-223). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "20d9856cf018fb4ea9d199a3f2d18b6256ac6e69242dee66192a5722319c5f1f",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "5. Component boundary",
    "5.2 Quy tắc dependency"
  ]
}
```

### Full source shown text

```text
Quy tắc 4 và 6 làm cho “một cửa” kiểm được bằng code, không chỉ là cách gọi tên.
`adapterPort` là execute handle do Authority nhận từ registry tin cậy của
process dispatch; caller không được tự truyền implementation hoặc đổi handle
sau khi plan đã compile.
```

### Full target shown text

```text
Quy tắc 4 và 6 làm cho “một cửa” kiểm được bằng code, không chỉ là cách gọi tên.
`adapterPort` là execute handle do Authority nhận từ registry tin cậy của
process dispatch; caller không được tự truyền implementation hoặc đổi handle
sau khi plan đã compile.
```
