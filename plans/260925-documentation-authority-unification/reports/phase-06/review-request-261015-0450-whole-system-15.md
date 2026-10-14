# Bounded whole-system source review request

Content commit: `a8a10abc1a24218518a14764f68c8d86f4810f91`. Author session: `codex-session:37@2026-10-15`. Review mode requested: ordinary.

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s6-whole-system-architecture-map.json`. Part 2/2; entries: **39**. Sidecar: `review-request-261015-0450-whole-system-15.md.json`.

Read review-brief.md, owner-answers.md A28–A37, frozen whole-system map, constitution, vocabulary and shard schema. Apply A36: mechanically check every row (full digest recompute, anchor check, shard/pack equality); deeply read the reviewer-seeded sample plus every differing-digest row in both directions with its diff. Preserve conditions, qualifiers, dated status and complete payload; verify one owner and labelled additions. No approval is supplied here.

Step 6’s closing review is a **checkpoint review whose sensitivity pack the reviewer holds**. The author has not created, seen or selected that pack/key. Ordinary review and A36 sampling do not replace checkpoint sensitivity.

Ordinary verdict contract: `Reviewer: <independent identity>`, `Review mode: ordinary`, request/content/shard pins; one own note and full 64-hex shown-unit digests per row. Use ok/rework/hold. Consolidate parts into a complete report for the original shard before unchanged ordinary application; never edit decisions manually.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

A36 mandatory differing-digest rows (16): `claim_7f76c2f307bb727f353ef7381941e90d`, `claim_8c4173ddf096521c1e38ca75992fd7b7`, `claim_dc33e5caba969ad06f15d0b1f46648c4`, `claim_75c04dd05c52523221b9cd4aaa91fdd9`, `claim_46b3e28983f6172dee7dbd1b7a1d6425`, `claim_0517abf08c7cf315ffcee0ea6727a164`, `claim_cf495e74b983b3e0436a07b23719ea7a`, `claim_09c8a0450eb9a4c11372dc71dc861376`, `claim_c9b5efd58eee31775ccb7a3a95a675b9`, `claim_facf53c13cb93d580976c5f07bf16c36`, `claim_e1ec652c882728067e70a1e31373e8f1`, `claim_e191cbbce5d4f83c78026363188c4bf6`, `claim_f6e78a761339fea3ff5b51a76f7ca1fa`, `claim_cdbd65b487c20e2518c8b4fc4f3f9d21`, `claim_28a7014f4b61295d24a6b2c06c8d65e4`, `claim_0b812df6a0a21a8677eba1af4d33079f`.

Absent-target rows (0): none.

This pack has 39 Weak-exact/Judgment rows; reviewer independently draws/records at least 10 by seed (>=15%, minimum 10, all if fewer), plus every differing pair listed above. Each verdict note says deep or mechanical. If >3% of deep-read rows need rework, deeply read the complete pack before reporting. Author selected no sample. Whole batch: 300 Unit-exact, 392 Weak-exact, 134 Judgment, all 826 pending; 123 mandatory differing pairs. The 79-row batch-wide lower bound does not replace each pack minimum.

Reverse review: the separate native candidate-unverified request/list covers the complete scoped population; it is not reset per sliced pack. Full shown text hashes below bind payload separately from native heading identity digests.

## claim_18ab678aaebf90ac59c7fb81a78aafb5

Source: `docs/architecture-map.md#unheaded-block-61`. Target: `docs/platform/architecture-map.md#unheaded-block-75`.

Mechanical class: Weak-exact. Source digest: `0210742b69578be4076a3b00b4ed33b5de4d5611603676fcc238fb0fa6c069c2`. Target digest: `0210742b69578be4076a3b00b4ed33b5de4d5611603676fcc238fb0fa6c069c2`.

Full shown source SHA256: `0210742b69578be4076a3b00b4ed33b5de4d5611603676fcc238fb0fa6c069c2`. Full shown target SHA256: `0210742b69578be4076a3b00b4ed33b5de4d5611603676fcc238fb0fa6c069c2`.

### Proposed decision

```json
{
  "claimId": "claim_18ab678aaebf90ac59c7fb81a78aafb5",
  "sourceUnitDigest": "0210742b69578be4076a3b00b4ed33b5de4d5611603676fcc238fb0fa6c069c2",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "unheaded-block-75",
  "targetUnitDigest": "0210742b69578be4076a3b00b4ed33b5de4d5611603676fcc238fb0fa6c069c2",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "12 · Chỗ đứng trong hệ tài liệu"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-61 (lines 527–531) into docs/platform/architecture-map.md#unheaded-block-75 (lines 604–608), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Entity xuất hiện ở cả hai bản đồ cross-link qua contract: work item ↔ CTR002 ·
human-gate ↔ CTR004 · outcome ↔ CTR002 · handoff ↔ CTR006. Bản đồ nằm trong đường đọc
chuẩn: `docs/specs/reading-map.md` + mục lục README (nối tại record ADR0010).

---
```

### Full target shown text

```text
Entity xuất hiện ở cả hai bản đồ cross-link qua contract: work item ↔ CTR002 ·
human-gate ↔ CTR004 · outcome ↔ CTR002 · handoff ↔ CTR006. Bản đồ nằm trong đường đọc
chuẩn: `docs/specs/reading-map.md` + mục lục README (nối tại record ADR0010).

---
```

### Unified diff

```diff
No text difference.
```

## claim_7f76c2f307bb727f353ef7381941e90d

Source: `docs/architecture-map.md#phụ-lục-a-hai-luật-vàng-của-thang-phân-chia`. Target: `docs/platform/architecture-map.md#phụ-lục-a-hai-luật-vàng-của-thang-phân-chia`.

Mechanical class: Judgment. Source digest: `bd78c04eeff896022adbfe596dea5fee30d4907bf4b908d4baa5e11eb8cd3442`. Target digest: `a636042766b7653cb8fe958f4073b78bf378099f86b194f979fd992660cdfda8`.

Full shown source SHA256: `02d2b9348da01770301be83e8e5b8ff7885910ed8b3922c0ace0b02b1df1a35f`. Full shown target SHA256: `21c650cba22bc510f4b68d4724f117982d67b404b617f503562e8db3b043f88f`.

### Proposed decision

```json
{
  "claimId": "claim_7f76c2f307bb727f353ef7381941e90d",
  "sourceUnitDigest": "bd78c04eeff896022adbfe596dea5fee30d4907bf4b908d4baa5e11eb8cd3442",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "phụ-lục-a-hai-luật-vàng-của-thang-phân-chia",
  "targetUnitDigest": "a636042766b7653cb8fe958f4073b78bf378099f86b194f979fd992660cdfda8",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architecture-map.md#phụ-lục-a-hai-luật-vàng-của-thang-phân-chia (lines 533–533) into docs/platform/architecture-map.md#phụ-lục-a-hai-luật-vàng-của-thang-phân-chia (lines 610–610), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## Phụ lục A · Hai luật vàng của thang phân chia

1. **Logic vs vật lý gãy một lần, không fractal.** Ranh giới trong-tiến-trình đổi
   rẻ; ranh giới qua-mạng đổi đắt — latency, partial failure, versioning. Một điểm
   đứt gãy chất, không phải bản thu nhỏ của các bậc dưới.
2. **Kéo ranh giới xuống bậc rẻ nhất vẫn đủ cô lập.** Đừng mua mạng khi interface
   đủ. (Áp dụng: attention hub là thành phần ngoài-process duy nhất của sổ — và nó
   ở maturity `idea`, đúng như luật này đòi.)

Tiêu chí cắt khác nhau ở mỗi bậc — class cắt theo actor, service cắt theo
deploy/team, agent cắt theo kinh tế context-window và tính phi tất định.

---
```

### Full target shown text

```text
#### Phụ lục A · Hai luật vàng của thang phân chia

1. **Logic vs vật lý gãy một lần, không fractal.** Ranh giới trong-tiến-trình đổi
   rẻ; ranh giới qua-mạng đổi đắt — latency, partial failure, versioning. Một điểm
   đứt gãy chất, không phải bản thu nhỏ của các bậc dưới.
2. **Kéo ranh giới xuống bậc rẻ nhất vẫn đủ cô lập.** Đừng mua mạng khi interface
   đủ. (Áp dụng: attention hub là thành phần ngoài-process duy nhất của sổ — và nó
   ở maturity `idea`, đúng như luật này đòi.)

Tiêu chí cắt khác nhau ở mỗi bậc — class cắt theo actor, service cắt theo
deploy/team, agent cắt theo kinh tế context-window và tính phi tất định.

---
```

### Unified diff

```diff
--- docs/architecture-map.md#phụ-lục-a-hai-luật-vàng-của-thang-phân-chia
+++ docs/platform/architecture-map.md#phụ-lục-a-hai-luật-vàng-của-thang-phân-chia
@@ -1,4 +1,4 @@
-## Phụ lục A · Hai luật vàng của thang phân chia
+#### Phụ lục A · Hai luật vàng của thang phân chia
 
 1. **Logic vs vật lý gãy một lần, không fractal.** Ranh giới trong-tiến-trình đổi
    rẻ; ranh giới qua-mạng đổi đắt — latency, partial failure, versioning. Một điểm

```

## claim_f271e57e8c5e2801173842a27933919c

Source: `docs/architecture-map.md#unheaded-block-62`. Target: `docs/platform/architecture-map.md#unheaded-block-76`.

Mechanical class: Weak-exact. Source digest: `67d6a518a382823f2b125648ee1507aa667bdc02a02810e6c2c86830b7761067`. Target digest: `67d6a518a382823f2b125648ee1507aa667bdc02a02810e6c2c86830b7761067`.

Full shown source SHA256: `67d6a518a382823f2b125648ee1507aa667bdc02a02810e6c2c86830b7761067`. Full shown target SHA256: `67d6a518a382823f2b125648ee1507aa667bdc02a02810e6c2c86830b7761067`.

### Proposed decision

```json
{
  "claimId": "claim_f271e57e8c5e2801173842a27933919c",
  "sourceUnitDigest": "67d6a518a382823f2b125648ee1507aa667bdc02a02810e6c2c86830b7761067",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "unheaded-block-76",
  "targetUnitDigest": "67d6a518a382823f2b125648ee1507aa667bdc02a02810e6c2c86830b7761067",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Phụ lục A · Hai luật vàng của thang phân chia"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-62 (lines 535–540) into docs/platform/architecture-map.md#unheaded-block-76 (lines 612–617), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
1. **Logic vs vật lý gãy một lần, không fractal.** Ranh giới trong-tiến-trình đổi
   rẻ; ranh giới qua-mạng đổi đắt — latency, partial failure, versioning. Một điểm
   đứt gãy chất, không phải bản thu nhỏ của các bậc dưới.
2. **Kéo ranh giới xuống bậc rẻ nhất vẫn đủ cô lập.** Đừng mua mạng khi interface
   đủ. (Áp dụng: attention hub là thành phần ngoài-process duy nhất của sổ — và nó
   ở maturity `idea`, đúng như luật này đòi.)
```

### Full target shown text

```text
1. **Logic vs vật lý gãy một lần, không fractal.** Ranh giới trong-tiến-trình đổi
   rẻ; ranh giới qua-mạng đổi đắt — latency, partial failure, versioning. Một điểm
   đứt gãy chất, không phải bản thu nhỏ của các bậc dưới.
2. **Kéo ranh giới xuống bậc rẻ nhất vẫn đủ cô lập.** Đừng mua mạng khi interface
   đủ. (Áp dụng: attention hub là thành phần ngoài-process duy nhất của sổ — và nó
   ở maturity `idea`, đúng như luật này đòi.)
```

### Unified diff

```diff
No text difference.
```

## claim_b36347e8fcad294d0ee42962bf5df843

Source: `docs/architecture-map.md#unheaded-block-63`. Target: `docs/platform/architecture-map.md#unheaded-block-77`.

Mechanical class: Weak-exact. Source digest: `ca2a9358a111abf2d642244ade351ade92e48e7bc2f33ac6d012d2f217001df1`. Target digest: `ca2a9358a111abf2d642244ade351ade92e48e7bc2f33ac6d012d2f217001df1`.

Full shown source SHA256: `ca2a9358a111abf2d642244ade351ade92e48e7bc2f33ac6d012d2f217001df1`. Full shown target SHA256: `ca2a9358a111abf2d642244ade351ade92e48e7bc2f33ac6d012d2f217001df1`.

### Proposed decision

```json
{
  "claimId": "claim_b36347e8fcad294d0ee42962bf5df843",
  "sourceUnitDigest": "ca2a9358a111abf2d642244ade351ade92e48e7bc2f33ac6d012d2f217001df1",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "unheaded-block-77",
  "targetUnitDigest": "ca2a9358a111abf2d642244ade351ade92e48e7bc2f33ac6d012d2f217001df1",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Phụ lục A · Hai luật vàng của thang phân chia"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-63 (lines 542–545) into docs/platform/architecture-map.md#unheaded-block-77 (lines 619–622), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Tiêu chí cắt khác nhau ở mỗi bậc — class cắt theo actor, service cắt theo
deploy/team, agent cắt theo kinh tế context-window và tính phi tất định.

---
```

### Full target shown text

```text
Tiêu chí cắt khác nhau ở mỗi bậc — class cắt theo actor, service cắt theo
deploy/team, agent cắt theo kinh tế context-window và tính phi tất định.

---
```

### Unified diff

```diff
No text difference.
```

## claim_8c4173ddf096521c1e38ca75992fd7b7

Source: `docs/architecture-map.md#phụ-lục-b-sổ-đăng-ký-hệ-idtên-gọi-str47-record-adr0017`. Target: `docs/platform/architecture-map.md#phụ-lục-b-sổ-đăng-ký-hệ-idtên-gọi-str47-record-adr0017`.

Mechanical class: Judgment. Source digest: `1aba694c0333a99c28a3e880821edf9fdc5dfd0f0128d040a7ad4483a9f2d25a`. Target digest: `49ba35b1c685575f709d3a11505dcf75a0e9fad6db867deb03a5861a5eb12fb2`.

Full shown source SHA256: `87f583e2cc7c343d4a41d656eeaf61627dcdf6b74983f00b791d4dcda40ba901`. Full shown target SHA256: `64c354f29cd3fc36c066b488b017ef5623925049499e103d09e10a781322668d`.

### Proposed decision

```json
{
  "claimId": "claim_8c4173ddf096521c1e38ca75992fd7b7",
  "sourceUnitDigest": "1aba694c0333a99c28a3e880821edf9fdc5dfd0f0128d040a7ad4483a9f2d25a",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "phụ-lục-b-sổ-đăng-ký-hệ-idtên-gọi-str47-record-adr0017",
  "targetUnitDigest": "49ba35b1c685575f709d3a11505dcf75a0e9fad6db867deb03a5861a5eb12fb2",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architecture-map.md#phụ-lục-b-sổ-đăng-ký-hệ-idtên-gọi-str47-record-adr0017 (lines 547–547) into docs/platform/architecture-map.md#phụ-lục-b-sổ-đăng-ký-hệ-idtên-gọi-str47-record-adr0017 (lines 624–624), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## Phụ lục B · Sổ đăng ký hệ id/tên gọi (STR47, record ADR0017)

Bản tóm tắt — nguồn đầy đủ + bằng chứng file:line: `docs/id-systems-audit.md`.

| Prefix/hình dạng | Hệ | Tầng |
|---|---|---|
| `tsk-<hash>` (+ `-<n>` con) | Task (`work.id`) | fgOS — sản phẩm |
| `STR<n>` | Story (backlog PBI) | fgOS — sản phẩm |
| `ADR<n>` (trích rút gọn của `NNNN-slug.md`) | Decision record | fgOS — sản phẩm |
| `RUL<n>` (không unique toàn cục, kèm tên area khi trích ngoài spec gốc) | Business rule | fgOS — sản phẩm |
| `CTR<n>` (3-digit zero-pad) | Contract (sổ §7 file này) | fgOS — sản phẩm |
| `D<hex>` (8-hex khi trích) | Quyết định toàn xưởng | bee — giàn giáo tạm |
| `D<n>` (số nguyên nhỏ) | Quyết định cục bộ 1 feature — **không bao giờ trích ngoài `CONTEXT.md` gốc** | bee — giàn giáo tạm |
| `<feature>-N` | cell-id | bee — giàn giáo tạm |
| kebab tự do | feature slug | bee — giàn giáo tạm |
| `P1`/`P2`/`P3` | Severity | bee — giàn giáo tạm |

Ranh giới: cột fgOS là **sản phẩm vĩnh viễn** (fgOS tự sinh/tự đọc được, không
phụ thuộc bee); cột bee là **giàn giáo tạm** cho giai đoạn xây fgOS — giữ
nguyên định dạng hiện tại, không đầu tư đổi tên/migrate (khung quyết định:
`docs/decisions/0004-pham-vi-va-non-goal.md`, chốt tại `docs/decisions/0017-...md`).

---
```

### Full target shown text

```text
#### Phụ lục B · Sổ đăng ký hệ id/tên gọi (STR47, record ADR0017)

Bản tóm tắt — nguồn đầy đủ + bằng chứng file:line: `docs/id-systems-audit.md`.

| Prefix/hình dạng | Hệ | Tầng |
|---|---|---|
| `tsk-<hash>` (+ `-<n>` con) | Task (`work.id`) | fgOS — sản phẩm |
| `STR<n>` | Story (backlog PBI) | fgOS — sản phẩm |
| `ADR<n>` (trích rút gọn của `NNNN-slug.md`) | Decision record | fgOS — sản phẩm |
| `RUL<n>` (không unique toàn cục, kèm tên area khi trích ngoài spec gốc) | Business rule | fgOS — sản phẩm |
| `CTR<n>` (3-digit zero-pad) | Contract (sổ §7 file này) | fgOS — sản phẩm |
| `D<hex>` (8-hex khi trích) | Quyết định toàn xưởng | bee — giàn giáo tạm |
| `D<n>` (số nguyên nhỏ) | Quyết định cục bộ 1 feature — **không bao giờ trích ngoài `CONTEXT.md` gốc** | bee — giàn giáo tạm |
| `<feature>-N` | cell-id | bee — giàn giáo tạm |
| kebab tự do | feature slug | bee — giàn giáo tạm |
| `P1`/`P2`/`P3` | Severity | bee — giàn giáo tạm |

Ranh giới: cột fgOS là **sản phẩm vĩnh viễn** (fgOS tự sinh/tự đọc được, không
phụ thuộc bee); cột bee là **giàn giáo tạm** cho giai đoạn xây fgOS — giữ
nguyên định dạng hiện tại, không đầu tư đổi tên/migrate (khung quyết định:
`docs/decisions/0004-pham-vi-va-non-goal.md`, chốt tại `docs/decisions/0017-...md`).

---
```

### Unified diff

```diff
--- docs/architecture-map.md#phụ-lục-b-sổ-đăng-ký-hệ-idtên-gọi-str47-record-adr0017
+++ docs/platform/architecture-map.md#phụ-lục-b-sổ-đăng-ký-hệ-idtên-gọi-str47-record-adr0017
@@ -1,4 +1,4 @@
-## Phụ lục B · Sổ đăng ký hệ id/tên gọi (STR47, record ADR0017)
+#### Phụ lục B · Sổ đăng ký hệ id/tên gọi (STR47, record ADR0017)
 
 Bản tóm tắt — nguồn đầy đủ + bằng chứng file:line: `docs/id-systems-audit.md`.
 

```

## claim_07b62c23c3f96c1257d292c683a043d0

Source: `docs/architecture-map.md#unheaded-block-64`. Target: `docs/platform/architecture-map.md#unheaded-block-78`.

Mechanical class: Weak-exact. Source digest: `8ac6fe66cae1699bd7bee9dc6b2761a2bb4767aee4a474dfd44aa2380d83868b`. Target digest: `8ac6fe66cae1699bd7bee9dc6b2761a2bb4767aee4a474dfd44aa2380d83868b`.

Full shown source SHA256: `8ac6fe66cae1699bd7bee9dc6b2761a2bb4767aee4a474dfd44aa2380d83868b`. Full shown target SHA256: `8ac6fe66cae1699bd7bee9dc6b2761a2bb4767aee4a474dfd44aa2380d83868b`.

### Proposed decision

```json
{
  "claimId": "claim_07b62c23c3f96c1257d292c683a043d0",
  "sourceUnitDigest": "8ac6fe66cae1699bd7bee9dc6b2761a2bb4767aee4a474dfd44aa2380d83868b",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "unheaded-block-78",
  "targetUnitDigest": "8ac6fe66cae1699bd7bee9dc6b2761a2bb4767aee4a474dfd44aa2380d83868b",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Phụ lục B · Sổ đăng ký hệ id/tên gọi (STR47, record ADR0017)"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-64 (lines 549–549) into docs/platform/architecture-map.md#unheaded-block-78 (lines 626–626), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Bản tóm tắt — nguồn đầy đủ + bằng chứng file:line: `docs/id-systems-audit.md`.
```

### Full target shown text

```text
Bản tóm tắt — nguồn đầy đủ + bằng chứng file:line: `docs/id-systems-audit.md`.
```

### Unified diff

```diff
No text difference.
```

## claim_5fe7a9b12f11f2fb629445c230b3b025

Source: `docs/architecture-map.md#unheaded-block-65`. Target: `docs/platform/architecture-map.md#unheaded-block-79`.

Mechanical class: Weak-exact. Source digest: `f7d543cb422dbf67a32ba21672d7450ca1d8d9ffbcb56011cd1696be36861991`. Target digest: `f7d543cb422dbf67a32ba21672d7450ca1d8d9ffbcb56011cd1696be36861991`.

Full shown source SHA256: `f7d543cb422dbf67a32ba21672d7450ca1d8d9ffbcb56011cd1696be36861991`. Full shown target SHA256: `f7d543cb422dbf67a32ba21672d7450ca1d8d9ffbcb56011cd1696be36861991`.

### Proposed decision

```json
{
  "claimId": "claim_5fe7a9b12f11f2fb629445c230b3b025",
  "sourceUnitDigest": "f7d543cb422dbf67a32ba21672d7450ca1d8d9ffbcb56011cd1696be36861991",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "unheaded-block-79",
  "targetUnitDigest": "f7d543cb422dbf67a32ba21672d7450ca1d8d9ffbcb56011cd1696be36861991",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Phụ lục B · Sổ đăng ký hệ id/tên gọi (STR47, record ADR0017)"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-65 (lines 551–562) into docs/platform/architecture-map.md#unheaded-block-79 (lines 628–639), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
| Prefix/hình dạng | Hệ | Tầng |
|---|---|---|
| `tsk-<hash>` (+ `-<n>` con) | Task (`work.id`) | fgOS — sản phẩm |
| `STR<n>` | Story (backlog PBI) | fgOS — sản phẩm |
| `ADR<n>` (trích rút gọn của `NNNN-slug.md`) | Decision record | fgOS — sản phẩm |
| `RUL<n>` (không unique toàn cục, kèm tên area khi trích ngoài spec gốc) | Business rule | fgOS — sản phẩm |
| `CTR<n>` (3-digit zero-pad) | Contract (sổ §7 file này) | fgOS — sản phẩm |
| `D<hex>` (8-hex khi trích) | Quyết định toàn xưởng | bee — giàn giáo tạm |
| `D<n>` (số nguyên nhỏ) | Quyết định cục bộ 1 feature — **không bao giờ trích ngoài `CONTEXT.md` gốc** | bee — giàn giáo tạm |
| `<feature>-N` | cell-id | bee — giàn giáo tạm |
| kebab tự do | feature slug | bee — giàn giáo tạm |
| `P1`/`P2`/`P3` | Severity | bee — giàn giáo tạm |
```

### Full target shown text

```text
| Prefix/hình dạng | Hệ | Tầng |
|---|---|---|
| `tsk-<hash>` (+ `-<n>` con) | Task (`work.id`) | fgOS — sản phẩm |
| `STR<n>` | Story (backlog PBI) | fgOS — sản phẩm |
| `ADR<n>` (trích rút gọn của `NNNN-slug.md`) | Decision record | fgOS — sản phẩm |
| `RUL<n>` (không unique toàn cục, kèm tên area khi trích ngoài spec gốc) | Business rule | fgOS — sản phẩm |
| `CTR<n>` (3-digit zero-pad) | Contract (sổ §7 file này) | fgOS — sản phẩm |
| `D<hex>` (8-hex khi trích) | Quyết định toàn xưởng | bee — giàn giáo tạm |
| `D<n>` (số nguyên nhỏ) | Quyết định cục bộ 1 feature — **không bao giờ trích ngoài `CONTEXT.md` gốc** | bee — giàn giáo tạm |
| `<feature>-N` | cell-id | bee — giàn giáo tạm |
| kebab tự do | feature slug | bee — giàn giáo tạm |
| `P1`/`P2`/`P3` | Severity | bee — giàn giáo tạm |
```

### Unified diff

```diff
No text difference.
```

## claim_19b466522419976e53a5c637f94a0f6a

Source: `docs/architecture-map.md#unheaded-block-66`. Target: `docs/platform/architecture-map.md#unheaded-block-80`.

Mechanical class: Weak-exact. Source digest: `5f10aa1d9a6a5736bcb7760a5b1495379265199c1a0fb25fe46232e14f7a6550`. Target digest: `5f10aa1d9a6a5736bcb7760a5b1495379265199c1a0fb25fe46232e14f7a6550`.

Full shown source SHA256: `5f10aa1d9a6a5736bcb7760a5b1495379265199c1a0fb25fe46232e14f7a6550`. Full shown target SHA256: `5f10aa1d9a6a5736bcb7760a5b1495379265199c1a0fb25fe46232e14f7a6550`.

### Proposed decision

```json
{
  "claimId": "claim_19b466522419976e53a5c637f94a0f6a",
  "sourceUnitDigest": "5f10aa1d9a6a5736bcb7760a5b1495379265199c1a0fb25fe46232e14f7a6550",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "unheaded-block-80",
  "targetUnitDigest": "5f10aa1d9a6a5736bcb7760a5b1495379265199c1a0fb25fe46232e14f7a6550",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Phụ lục B · Sổ đăng ký hệ id/tên gọi (STR47, record ADR0017)"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-66 (lines 564–569) into docs/platform/architecture-map.md#unheaded-block-80 (lines 641–646), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Ranh giới: cột fgOS là **sản phẩm vĩnh viễn** (fgOS tự sinh/tự đọc được, không
phụ thuộc bee); cột bee là **giàn giáo tạm** cho giai đoạn xây fgOS — giữ
nguyên định dạng hiện tại, không đầu tư đổi tên/migrate (khung quyết định:
`docs/decisions/0004-pham-vi-va-non-goal.md`, chốt tại `docs/decisions/0017-...md`).

---
```

### Full target shown text

```text
Ranh giới: cột fgOS là **sản phẩm vĩnh viễn** (fgOS tự sinh/tự đọc được, không
phụ thuộc bee); cột bee là **giàn giáo tạm** cho giai đoạn xây fgOS — giữ
nguyên định dạng hiện tại, không đầu tư đổi tên/migrate (khung quyết định:
`docs/decisions/0004-pham-vi-va-non-goal.md`, chốt tại `docs/decisions/0017-...md`).

---
```

### Unified diff

```diff
No text difference.
```

## claim_dc33e5caba969ad06f15d0b1f46648c4

Source: `docs/architecture-map.md#câu-hỏi-mở-đã-chốt-tại-record-adr0010-chấp-nhận-không-phản-biện-theo-đề-xuất`. Target: `docs/platform/architecture-map.md#câu-hỏi-mở-đã-chốt-tại-record-adr0010-chấp-nhận-không-phản-biện-theo-đề-xuất`.

Mechanical class: Judgment. Source digest: `8a0d7f63cb86303b06f36e0f56d7b9cd840e0e56e4b176c2c5d04f5f0a006d28`. Target digest: `c2aa032c6cab348c576fb62269be72a645a70eb912a1b58311ab949a804d34e4`.

Full shown source SHA256: `4573e6bb4d573fb67a554c3f9bd7fa8b7c4d91b91c1959908c0cbef60bf8a2b8`. Full shown target SHA256: `ec94ee54af6fbe5b14dbb3373e0fe6d227fa3c1bc0a609f551904f279f3d5119`.

### Proposed decision

```json
{
  "claimId": "claim_dc33e5caba969ad06f15d0b1f46648c4",
  "sourceUnitDigest": "8a0d7f63cb86303b06f36e0f56d7b9cd840e0e56e4b176c2c5d04f5f0a006d28",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "câu-hỏi-mở-đã-chốt-tại-record-adr0010-chấp-nhận-không-phản-biện-theo-đề-xuất",
  "targetUnitDigest": "c2aa032c6cab348c576fb62269be72a645a70eb912a1b58311ab949a804d34e4",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architecture-map.md#câu-hỏi-mở-đã-chốt-tại-record-adr0010-chấp-nhận-không-phản-biện-theo-đề-xuất (lines 571–571) into docs/platform/architecture-map.md#câu-hỏi-mở-đã-chốt-tại-record-adr0010-chấp-nhận-không-phản-biện-theo-đề-xuất (lines 648–648), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## Câu hỏi mở — đã chốt tại record ADR0010 (chấp nhận không phản biện, theo đề xuất)

1. **Đa tiến trình:** điểm yếu thật là **CTR002 một-cửa-ghi per-process** (JSONL + fs,
   chưa lease/lock). **Chốt:** ghi nợ có tên trong CTR002; giải ở PBI riêng, bắt buộc
   xong **trước STR6 (fan-out)** — không chặn STR15.
2. **Nghi thức thẻ-trước-code chạm L5.** **Chốt:** hiệu lực như *phụ lục
   definition-of-done* qua record ADR0010 — không sửa văn bản L5 tại chỗ, không mở
   luật L9 mới; nếu L5 tới ngưỡng xem lại thì gộp chính thức khi supersede.
3. **Nhà của `dispatch.mjs`.** **Chốt:** giữ một file ở Infra; chỉ tách port/spawn
   khi STR8 hoặc STR16 thật sự cần hai nhịp đổi khác nhau (YAGNI).
4. **CTR001 live.** Envelope port đầu tại STR14 (`submit`), nay đủ trên MỌI verb qua một cửa in duy nhất, kèm sổ verb máy-đọc `--help --json` (STR37, per D b2d18cc7/b0da87aa).
5. **Registry-manifest + 2 phép kiểm máy (§9.3).** **Chốt:** đứng riêng **trước
   S2** — là PBI **STR20** trong backlog; nó canh mọi feature sau.
```

### Full target shown text

```text
#### Câu hỏi mở — đã chốt tại record ADR0010 (chấp nhận không phản biện, theo đề xuất)

1. **Đa tiến trình:** điểm yếu thật là **CTR002 một-cửa-ghi per-process** (JSONL + fs,
   chưa lease/lock). **Chốt:** ghi nợ có tên trong CTR002; giải ở PBI riêng, bắt buộc
   xong **trước STR6 (fan-out)** — không chặn STR15.
2. **Nghi thức thẻ-trước-code chạm L5.** **Chốt:** hiệu lực như *phụ lục
   definition-of-done* qua record ADR0010 — không sửa văn bản L5 tại chỗ, không mở
   luật L9 mới; nếu L5 tới ngưỡng xem lại thì gộp chính thức khi supersede.
3. **Nhà của `dispatch.mjs`.** **Chốt:** giữ một file ở Infra; chỉ tách port/spawn
   khi STR8 hoặc STR16 thật sự cần hai nhịp đổi khác nhau (YAGNI).
4. **CTR001 live.** Envelope port đầu tại STR14 (`submit`), nay đủ trên MỌI verb qua một cửa in duy nhất, kèm sổ verb máy-đọc `--help --json` (STR37, per D b2d18cc7/b0da87aa).
5. **Registry-manifest + 2 phép kiểm máy (§9.3).** **Chốt:** đứng riêng **trước
   S2** — là PBI **STR20** trong backlog; nó canh mọi feature sau.
```

### Unified diff

```diff
--- docs/architecture-map.md#câu-hỏi-mở-đã-chốt-tại-record-adr0010-chấp-nhận-không-phản-biện-theo-đề-xuất
+++ docs/platform/architecture-map.md#câu-hỏi-mở-đã-chốt-tại-record-adr0010-chấp-nhận-không-phản-biện-theo-đề-xuất
@@ -1,4 +1,4 @@
-## Câu hỏi mở — đã chốt tại record ADR0010 (chấp nhận không phản biện, theo đề xuất)
+#### Câu hỏi mở — đã chốt tại record ADR0010 (chấp nhận không phản biện, theo đề xuất)
 
 1. **Đa tiến trình:** điểm yếu thật là **CTR002 một-cửa-ghi per-process** (JSONL + fs,
    chưa lease/lock). **Chốt:** ghi nợ có tên trong CTR002; giải ở PBI riêng, bắt buộc

```

## claim_d61dc5755f5cc670087a649e135074c8

Source: `docs/architecture-map.md#unheaded-block-67`. Target: `docs/platform/architecture-map.md#unheaded-block-81`.

Mechanical class: Weak-exact. Source digest: `3efcc0c54a6306c056bc52b916d9bd6d6b09c7be5c84287ec124778d1a56b168`. Target digest: `3efcc0c54a6306c056bc52b916d9bd6d6b09c7be5c84287ec124778d1a56b168`.

Full shown source SHA256: `3efcc0c54a6306c056bc52b916d9bd6d6b09c7be5c84287ec124778d1a56b168`. Full shown target SHA256: `3efcc0c54a6306c056bc52b916d9bd6d6b09c7be5c84287ec124778d1a56b168`.

### Proposed decision

```json
{
  "claimId": "claim_d61dc5755f5cc670087a649e135074c8",
  "sourceUnitDigest": "3efcc0c54a6306c056bc52b916d9bd6d6b09c7be5c84287ec124778d1a56b168",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "unheaded-block-81",
  "targetUnitDigest": "3efcc0c54a6306c056bc52b916d9bd6d6b09c7be5c84287ec124778d1a56b168",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Câu hỏi mở — đã chốt tại record ADR0010 (chấp nhận không phản biện, theo đề xuất)"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-67 (lines 573–583) into docs/platform/architecture-map.md#unheaded-block-81 (lines 650–660), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
1. **Đa tiến trình:** điểm yếu thật là **CTR002 một-cửa-ghi per-process** (JSONL + fs,
   chưa lease/lock). **Chốt:** ghi nợ có tên trong CTR002; giải ở PBI riêng, bắt buộc
   xong **trước STR6 (fan-out)** — không chặn STR15.
2. **Nghi thức thẻ-trước-code chạm L5.** **Chốt:** hiệu lực như *phụ lục
   definition-of-done* qua record ADR0010 — không sửa văn bản L5 tại chỗ, không mở
   luật L9 mới; nếu L5 tới ngưỡng xem lại thì gộp chính thức khi supersede.
3. **Nhà của `dispatch.mjs`.** **Chốt:** giữ một file ở Infra; chỉ tách port/spawn
   khi STR8 hoặc STR16 thật sự cần hai nhịp đổi khác nhau (YAGNI).
4. **CTR001 live.** Envelope port đầu tại STR14 (`submit`), nay đủ trên MỌI verb qua một cửa in duy nhất, kèm sổ verb máy-đọc `--help --json` (STR37, per D b2d18cc7/b0da87aa).
5. **Registry-manifest + 2 phép kiểm máy (§9.3).** **Chốt:** đứng riêng **trước
   S2** — là PBI **STR20** trong backlog; nó canh mọi feature sau.
```

### Full target shown text

```text
1. **Đa tiến trình:** điểm yếu thật là **CTR002 một-cửa-ghi per-process** (JSONL + fs,
   chưa lease/lock). **Chốt:** ghi nợ có tên trong CTR002; giải ở PBI riêng, bắt buộc
   xong **trước STR6 (fan-out)** — không chặn STR15.
2. **Nghi thức thẻ-trước-code chạm L5.** **Chốt:** hiệu lực như *phụ lục
   definition-of-done* qua record ADR0010 — không sửa văn bản L5 tại chỗ, không mở
   luật L9 mới; nếu L5 tới ngưỡng xem lại thì gộp chính thức khi supersede.
3. **Nhà của `dispatch.mjs`.** **Chốt:** giữ một file ở Infra; chỉ tách port/spawn
   khi STR8 hoặc STR16 thật sự cần hai nhịp đổi khác nhau (YAGNI).
4. **CTR001 live.** Envelope port đầu tại STR14 (`submit`), nay đủ trên MỌI verb qua một cửa in duy nhất, kèm sổ verb máy-đọc `--help --json` (STR37, per D b2d18cc7/b0da87aa).
5. **Registry-manifest + 2 phép kiểm máy (§9.3).** **Chốt:** đứng riêng **trước
   S2** — là PBI **STR20** trong backlog; nó canh mọi feature sau.
```

### Unified diff

```diff
No text difference.
```

## claim_75c04dd05c52523221b9cd4aaa91fdd9

Source: `docs/architecture-map.md#lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4`. Target: `docs/platform/architecture-map.md#lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4`.

Mechanical class: Judgment. Source digest: `bc78d75580f6f7b078f2b4654fd30fe4936587aa522476d1fcc02a89bf3c0ee3`. Target digest: `62697107509703563f7e687e9069f5dc507bd7c27f5cdcd21ef391b5615d9977`.

Full shown source SHA256: `0b7b13202a9f3c8d3071aa0a7cefb9e3acfaf5d196825f7333dc6771484f8d91`. Full shown target SHA256: `f39c356ef046fc39f85ad47aaacd5550c36a869fdd9d0ca7175f8f34d3321c5c`.

### Proposed decision

```json
{
  "claimId": "claim_75c04dd05c52523221b9cd4aaa91fdd9",
  "sourceUnitDigest": "bc78d75580f6f7b078f2b4654fd30fe4936587aa522476d1fcc02a89bf3c0ee3",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4",
  "targetUnitDigest": "62697107509703563f7e687e9069f5dc507bd7c27f5cdcd21ef391b5615d9977",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architecture-map.md#lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4 (lines 585–585) into docs/platform/architecture-map.md#lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4 (lines 662–662), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Retired decision narrative remains explicitly dated provenance within its area owner, not fresh current truth. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)

Các ADR dưới đây được di dời nguyên văn từ `docs/decisions/` (tsk-1lv-4, D5) -- corpus đó đã retired, `state.decisions` (qua `fgos decision --scope`) giữ record ngắn làm nguồn thật, phần narrative đầy đủ sống ở đây. Thứ tự theo số ADR gốc.
```

### Full target shown text

```text
#### Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)

Các ADR dưới đây được di dời nguyên văn từ `docs/decisions/` (tsk-1lv-4, D5) -- corpus đó đã retired, `state.decisions` (qua `fgos decision --scope`) giữ record ngắn làm nguồn thật, phần narrative đầy đủ sống ở đây. Thứ tự theo số ADR gốc.
```

### Unified diff

```diff
--- docs/architecture-map.md#lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4
+++ docs/platform/architecture-map.md#lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4
@@ -1,3 +1,3 @@
-## Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)
+#### Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)
 
 Các ADR dưới đây được di dời nguyên văn từ `docs/decisions/` (tsk-1lv-4, D5) -- corpus đó đã retired, `state.decisions` (qua `fgos decision --scope`) giữ record ngắn làm nguồn thật, phần narrative đầy đủ sống ở đây. Thứ tự theo số ADR gốc.

```

## claim_8e4300dbe2e2c6ee7cdeddbfbf97998a

Source: `docs/architecture-map.md#unheaded-block-68`. Target: `docs/platform/architecture-map.md#unheaded-block-82`.

Mechanical class: Weak-exact. Source digest: `672c35bd5a15bf5222b5e6a305c17dd229a1cf32cc85ebce79c9eaffe864219f`. Target digest: `672c35bd5a15bf5222b5e6a305c17dd229a1cf32cc85ebce79c9eaffe864219f`.

Full shown source SHA256: `672c35bd5a15bf5222b5e6a305c17dd229a1cf32cc85ebce79c9eaffe864219f`. Full shown target SHA256: `672c35bd5a15bf5222b5e6a305c17dd229a1cf32cc85ebce79c9eaffe864219f`.

### Proposed decision

```json
{
  "claimId": "claim_8e4300dbe2e2c6ee7cdeddbfbf97998a",
  "sourceUnitDigest": "672c35bd5a15bf5222b5e6a305c17dd229a1cf32cc85ebce79c9eaffe864219f",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "unheaded-block-82",
  "targetUnitDigest": "672c35bd5a15bf5222b5e6a305c17dd229a1cf32cc85ebce79c9eaffe864219f",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-68 (lines 587–587) into docs/platform/architecture-map.md#unheaded-block-82 (lines 664–664), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Các ADR dưới đây được di dời nguyên văn từ `docs/decisions/` (tsk-1lv-4, D5) -- corpus đó đã retired, `state.decisions` (qua `fgos decision --scope`) giữ record ngắn làm nguồn thật, phần narrative đầy đủ sống ở đây. Thứ tự theo số ADR gốc.
```

### Full target shown text

```text
Các ADR dưới đây được di dời nguyên văn từ `docs/decisions/` (tsk-1lv-4, D5) -- corpus đó đã retired, `state.decisions` (qua `fgos decision --scope`) giữ record ngắn làm nguồn thật, phần narrative đầy đủ sống ở đây. Thứ tự theo số ADR gốc.
```

### Unified diff

```diff
No text difference.
```

## claim_46b3e28983f6172dee7dbd1b7a1d6425

Source: `docs/architecture-map.md#0010-bản-đồ-kiến-trúc-là-bản-chuẩn`. Target: `docs/platform/architecture-map.md#0010-bản-đồ-kiến-trúc-là-bản-chuẩn`.

Mechanical class: Judgment. Source digest: `7b5588cc6b4fe23b51e8ccf18ccf19de8dfbc4250e42fac354cf8f57340e73b8`. Target digest: `8f6bfa776a264ccdd2434f8c7864705d22b1e859955f393f919ec76a219b941f`.

Full shown source SHA256: `1c44922a40ecb87ca6f6acb7de992c043938724fc5c68dd3002bf1cb1dc43b6d`. Full shown target SHA256: `a3423ea1255494c085bfbd84082ccd95723ea33d609f2b3e8a57c738c61fc97b`.

### Proposed decision

```json
{
  "claimId": "claim_46b3e28983f6172dee7dbd1b7a1d6425",
  "sourceUnitDigest": "7b5588cc6b4fe23b51e8ccf18ccf19de8dfbc4250e42fac354cf8f57340e73b8",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "0010-bản-đồ-kiến-trúc-là-bản-chuẩn",
  "targetUnitDigest": "8f6bfa776a264ccdd2434f8c7864705d22b1e859955f393f919ec76a219b941f",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architecture-map.md#0010-bản-đồ-kiến-trúc-là-bản-chuẩn (lines 590–590) into docs/platform/architecture-map.md#0010-bản-đồ-kiến-trúc-là-bản-chuẩn (lines 667–667), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
### 0010 — Bản đồ kiến trúc là bản chuẩn

**Ngày:** 2026-07-16 · **Trạng thái:** chốt
```

### Full target shown text

```text
##### 0010 — Bản đồ kiến trúc là bản chuẩn

**Ngày:** 2026-07-16 · **Trạng thái:** chốt
```

### Unified diff

```diff
--- docs/architecture-map.md#0010-bản-đồ-kiến-trúc-là-bản-chuẩn
+++ docs/platform/architecture-map.md#0010-bản-đồ-kiến-trúc-là-bản-chuẩn
@@ -1,3 +1,3 @@
-### 0010 — Bản đồ kiến trúc là bản chuẩn
+##### 0010 — Bản đồ kiến trúc là bản chuẩn
 
 **Ngày:** 2026-07-16 · **Trạng thái:** chốt

```

## claim_f9c8408485c625a5bf2abc9f9e28bf21

Source: `docs/architecture-map.md#unheaded-block-69`. Target: `docs/platform/architecture-map.md#unheaded-block-83`.

Mechanical class: Weak-exact. Source digest: `3f94867a5e73998538f7ca0a824389ba7e39e977a363a7e5adfcef32488b68a3`. Target digest: `3f94867a5e73998538f7ca0a824389ba7e39e977a363a7e5adfcef32488b68a3`.

Full shown source SHA256: `3f94867a5e73998538f7ca0a824389ba7e39e977a363a7e5adfcef32488b68a3`. Full shown target SHA256: `3f94867a5e73998538f7ca0a824389ba7e39e977a363a7e5adfcef32488b68a3`.

### Proposed decision

```json
{
  "claimId": "claim_f9c8408485c625a5bf2abc9f9e28bf21",
  "sourceUnitDigest": "3f94867a5e73998538f7ca0a824389ba7e39e977a363a7e5adfcef32488b68a3",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "unheaded-block-83",
  "targetUnitDigest": "3f94867a5e73998538f7ca0a824389ba7e39e977a363a7e5adfcef32488b68a3",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0010 — Bản đồ kiến trúc là bản chuẩn"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-69 (lines 592–592) into docs/platform/architecture-map.md#unheaded-block-83 (lines 669–669), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
**Ngày:** 2026-07-16 · **Trạng thái:** chốt
```

### Full target shown text

```text
**Ngày:** 2026-07-16 · **Trạng thái:** chốt
```

### Unified diff

```diff
No text difference.
```

## claim_0517abf08c7cf315ffcee0ea6727a164

Source: `docs/architecture-map.md#bối-cảnh`. Target: `docs/platform/architecture-map.md#bối-cảnh`.

Mechanical class: Judgment. Source digest: `c5f5921dba3018eef02c3ba3f7a1f858a4917e698b862c034a73f34b6f16f905`. Target digest: `c41a7144b53a4fe9ead770329ef185ffe47f2853b81a44f1c5247f51a7226275`.

Full shown source SHA256: `f35668ae76ae4a54f3b448634a4ea47864a9fd3dec5afb1a7e02e00450313771`. Full shown target SHA256: `3fe9f4c4a1cb36ba09ab8b6e7e608001c6dfe8b1368a7ff580303d58051c9249`.

### Proposed decision

```json
{
  "claimId": "claim_0517abf08c7cf315ffcee0ea6727a164",
  "sourceUnitDigest": "c5f5921dba3018eef02c3ba3f7a1f858a4917e698b862c034a73f34b6f16f905",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "bối-cảnh",
  "targetUnitDigest": "c41a7144b53a4fe9ead770329ef185ffe47f2853b81a44f1c5247f51a7226275",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0010 — Bản đồ kiến trúc là bản chuẩn"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architecture-map.md#bối-cảnh (lines 594–594) into docs/platform/architecture-map.md#bối-cảnh (lines 671–671), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
#### Bối cảnh

Hệ chuẩn bị nhận một loạt thành phần mới (S2 friction capture, STR14–STR17 lifecycle
stages, STR8 signal). Trước đó các khái niệm kiến trúc nằm rải trong tài liệu bàn
luận (ba trục ngang hàng, người đọc tự hợp nhất, tên va chạm, contract không tên).
`docs/architecture-map.md` được viết làm đề xuất hợp nhất, qua hai vòng phản biện
có kiểm chứng trên code: vòng 1 soi tự-nhất-quán (chiều phụ thuộc, maturity nói
thật), vòng 2 soi không-gian-âm (sổ thiếu module, chỗ đứng trong hệ docs) — và
việc dò tay toàn bộ đồ thị import khi viết lại đã phát hiện thứ tự tầng ban đầu
sai giữa Domain và Infra.
```

### Full target shown text

```text
###### Bối cảnh

Hệ chuẩn bị nhận một loạt thành phần mới (S2 friction capture, STR14–STR17 lifecycle
stages, STR8 signal). Trước đó các khái niệm kiến trúc nằm rải trong tài liệu bàn
luận (ba trục ngang hàng, người đọc tự hợp nhất, tên va chạm, contract không tên).
`docs/architecture-map.md` được viết làm đề xuất hợp nhất, qua hai vòng phản biện
có kiểm chứng trên code: vòng 1 soi tự-nhất-quán (chiều phụ thuộc, maturity nói
thật), vòng 2 soi không-gian-âm (sổ thiếu module, chỗ đứng trong hệ docs) — và
việc dò tay toàn bộ đồ thị import khi viết lại đã phát hiện thứ tự tầng ban đầu
sai giữa Domain và Infra.
```

### Unified diff

```diff
--- docs/architecture-map.md#bối-cảnh
+++ docs/platform/architecture-map.md#bối-cảnh
@@ -1,4 +1,4 @@
-#### Bối cảnh
+###### Bối cảnh
 
 Hệ chuẩn bị nhận một loạt thành phần mới (S2 friction capture, STR14–STR17 lifecycle
 stages, STR8 signal). Trước đó các khái niệm kiến trúc nằm rải trong tài liệu bàn

```

## claim_9894e6472c448813536cbeb289840b69

Source: `docs/architecture-map.md#unheaded-block-70`. Target: `docs/platform/architecture-map.md#unheaded-block-84`.

Mechanical class: Weak-exact. Source digest: `f3b045e3b9a3214257bfc9f843c491f5c63d31526043f1aaedbbe56a45324f32`. Target digest: `f3b045e3b9a3214257bfc9f843c491f5c63d31526043f1aaedbbe56a45324f32`.

Full shown source SHA256: `f3b045e3b9a3214257bfc9f843c491f5c63d31526043f1aaedbbe56a45324f32`. Full shown target SHA256: `f3b045e3b9a3214257bfc9f843c491f5c63d31526043f1aaedbbe56a45324f32`.

### Proposed decision

```json
{
  "claimId": "claim_9894e6472c448813536cbeb289840b69",
  "sourceUnitDigest": "f3b045e3b9a3214257bfc9f843c491f5c63d31526043f1aaedbbe56a45324f32",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "unheaded-block-84",
  "targetUnitDigest": "f3b045e3b9a3214257bfc9f843c491f5c63d31526043f1aaedbbe56a45324f32",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0010 — Bản đồ kiến trúc là bản chuẩn",
    "Bối cảnh"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-70 (lines 596–603) into docs/platform/architecture-map.md#unheaded-block-84 (lines 673–680), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Hệ chuẩn bị nhận một loạt thành phần mới (S2 friction capture, STR14–STR17 lifecycle
stages, STR8 signal). Trước đó các khái niệm kiến trúc nằm rải trong tài liệu bàn
luận (ba trục ngang hàng, người đọc tự hợp nhất, tên va chạm, contract không tên).
`docs/architecture-map.md` được viết làm đề xuất hợp nhất, qua hai vòng phản biện
có kiểm chứng trên code: vòng 1 soi tự-nhất-quán (chiều phụ thuộc, maturity nói
thật), vòng 2 soi không-gian-âm (sổ thiếu module, chỗ đứng trong hệ docs) — và
việc dò tay toàn bộ đồ thị import khi viết lại đã phát hiện thứ tự tầng ban đầu
sai giữa Domain và Infra.
```

### Full target shown text

```text
Hệ chuẩn bị nhận một loạt thành phần mới (S2 friction capture, STR14–STR17 lifecycle
stages, STR8 signal). Trước đó các khái niệm kiến trúc nằm rải trong tài liệu bàn
luận (ba trục ngang hàng, người đọc tự hợp nhất, tên va chạm, contract không tên).
`docs/architecture-map.md` được viết làm đề xuất hợp nhất, qua hai vòng phản biện
có kiểm chứng trên code: vòng 1 soi tự-nhất-quán (chiều phụ thuộc, maturity nói
thật), vòng 2 soi không-gian-âm (sổ thiếu module, chỗ đứng trong hệ docs) — và
việc dò tay toàn bộ đồ thị import khi viết lại đã phát hiện thứ tự tầng ban đầu
sai giữa Domain và Infra.
```

### Unified diff

```diff
No text difference.
```

## claim_cf495e74b983b3e0436a07b23719ea7a

Source: `docs/architecture-map.md#quyết-định`. Target: `docs/platform/architecture-map.md#quyết-định`.

Mechanical class: Judgment. Source digest: `18c751cb725fcbe97a9dab556b828ce70997df68a899d0b4ec5384a7851c4371`. Target digest: `6d72fd9b8065320bc79e7988acb045635ccff60ac5937da8f95d8278c1ac86bc`.

Full shown source SHA256: `06ddaadcdfce2a0d68b968c7f9aaa1bc4987743829e036214f35970d287d9db2`. Full shown target SHA256: `36eb89b4b9377a2b22f474e82a6071fee62d7db484e6a600dab5a2c8f20009b4`.

### Proposed decision

```json
{
  "claimId": "claim_cf495e74b983b3e0436a07b23719ea7a",
  "sourceUnitDigest": "18c751cb725fcbe97a9dab556b828ce70997df68a899d0b4ec5384a7851c4371",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "quyết-định",
  "targetUnitDigest": "6d72fd9b8065320bc79e7988acb045635ccff60ac5937da8f95d8278c1ac86bc",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0010 — Bản đồ kiến trúc là bản chuẩn"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architecture-map.md#quyết-định (lines 605–605) into docs/platform/architecture-map.md#quyết-định (lines 682–682), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
#### Quyết định

1. **`docs/architecture-map.md` v0.2 là bản chuẩn kiến trúc của fgOS.** Khung
   chính: 5 tầng `Entry → Use-case → Infra → Domain → Kernel`, phụ thuộc một
   chiều xuống (được nhảy tầng), đo trên đồ thị import thật. Host Adapter là ổ
   cắm (port + config), không phải tầng import. Hai lớp phủ: physics (5 từ dành
   riêng `store/event/state/signal/run`) và authority (6 vai). Hai sổ đăng ký:
   component (14/14 module, tách row component/slice) và contract (C1–C9).
2. **Nghi thức "thẻ căn cước trước code"** (map §9.1) có hiệu lực như **phụ lục
   definition-of-done**: một module/slice mới phải có row trong sổ §6 trước khi
   có code. Không sửa văn bản luật L5 tại chỗ, không mở luật mới — khi L5 tới
   ngưỡng xem lại thì gộp chính thức lúc supersede.
3. **Năm câu hỏi mở của bản đồ chốt theo đề xuất:** (a) nợ C2 một-cửa-ghi
   per-process giải ở PBI riêng trước STR6 fan-out, không chặn STR15; (b) xử lý L5
   như trên; (c) `dispatch.mjs` giữ một file ở Infra, chỉ tách khi STR8/STR16 đòi;
   (d) C1 envelope đợi STR14; (e) registry-manifest + 2 phép kiểm máy (chiều
   import + đủ sổ) là **PBI STR20, đứng trước S2-friction**.
4. Bản đồ nối vào đường đọc chuẩn: `docs/specs/reading-map.md` + mục lục README.
   Tài liệu bàn luận gốc ở xưởng hạ thành thinking record.
```

### Full target shown text

```text
###### Quyết định

1. **`docs/architecture-map.md` v0.2 là bản chuẩn kiến trúc của fgOS.** Khung
   chính: 5 tầng `Entry → Use-case → Infra → Domain → Kernel`, phụ thuộc một
   chiều xuống (được nhảy tầng), đo trên đồ thị import thật. Host Adapter là ổ
   cắm (port + config), không phải tầng import. Hai lớp phủ: physics (5 từ dành
   riêng `store/event/state/signal/run`) và authority (6 vai). Hai sổ đăng ký:
   component (14/14 module, tách row component/slice) và contract (C1–C9).
2. **Nghi thức "thẻ căn cước trước code"** (map §9.1) có hiệu lực như **phụ lục
   definition-of-done**: một module/slice mới phải có row trong sổ §6 trước khi
   có code. Không sửa văn bản luật L5 tại chỗ, không mở luật mới — khi L5 tới
   ngưỡng xem lại thì gộp chính thức lúc supersede.
3. **Năm câu hỏi mở của bản đồ chốt theo đề xuất:** (a) nợ C2 một-cửa-ghi
   per-process giải ở PBI riêng trước STR6 fan-out, không chặn STR15; (b) xử lý L5
   như trên; (c) `dispatch.mjs` giữ một file ở Infra, chỉ tách khi STR8/STR16 đòi;
   (d) C1 envelope đợi STR14; (e) registry-manifest + 2 phép kiểm máy (chiều
   import + đủ sổ) là **PBI STR20, đứng trước S2-friction**.
4. Bản đồ nối vào đường đọc chuẩn: `docs/specs/reading-map.md` + mục lục README.
   Tài liệu bàn luận gốc ở xưởng hạ thành thinking record.
```

### Unified diff

```diff
--- docs/architecture-map.md#quyết-định
+++ docs/platform/architecture-map.md#quyết-định
@@ -1,4 +1,4 @@
-#### Quyết định
+###### Quyết định
 
 1. **`docs/architecture-map.md` v0.2 là bản chuẩn kiến trúc của fgOS.** Khung
    chính: 5 tầng `Entry → Use-case → Infra → Domain → Kernel`, phụ thuộc một

```

## claim_7da7ccf0c2211d11bdcc8bfdf0dac6f3

Source: `docs/architecture-map.md#unheaded-block-71`. Target: `docs/platform/architecture-map.md#unheaded-block-85`.

Mechanical class: Weak-exact. Source digest: `dc2faabbdecd1934c105fe30fa697677ead2957990a360dac4d163b5db53e5f2`. Target digest: `dc2faabbdecd1934c105fe30fa697677ead2957990a360dac4d163b5db53e5f2`.

Full shown source SHA256: `dc2faabbdecd1934c105fe30fa697677ead2957990a360dac4d163b5db53e5f2`. Full shown target SHA256: `dc2faabbdecd1934c105fe30fa697677ead2957990a360dac4d163b5db53e5f2`.

### Proposed decision

```json
{
  "claimId": "claim_7da7ccf0c2211d11bdcc8bfdf0dac6f3",
  "sourceUnitDigest": "dc2faabbdecd1934c105fe30fa697677ead2957990a360dac4d163b5db53e5f2",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "unheaded-block-85",
  "targetUnitDigest": "dc2faabbdecd1934c105fe30fa697677ead2957990a360dac4d163b5db53e5f2",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0010 — Bản đồ kiến trúc là bản chuẩn",
    "Quyết định"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-71 (lines 607–623) into docs/platform/architecture-map.md#unheaded-block-85 (lines 684–700), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
1. **`docs/architecture-map.md` v0.2 là bản chuẩn kiến trúc của fgOS.** Khung
   chính: 5 tầng `Entry → Use-case → Infra → Domain → Kernel`, phụ thuộc một
   chiều xuống (được nhảy tầng), đo trên đồ thị import thật. Host Adapter là ổ
   cắm (port + config), không phải tầng import. Hai lớp phủ: physics (5 từ dành
   riêng `store/event/state/signal/run`) và authority (6 vai). Hai sổ đăng ký:
   component (14/14 module, tách row component/slice) và contract (C1–C9).
2. **Nghi thức "thẻ căn cước trước code"** (map §9.1) có hiệu lực như **phụ lục
   definition-of-done**: một module/slice mới phải có row trong sổ §6 trước khi
   có code. Không sửa văn bản luật L5 tại chỗ, không mở luật mới — khi L5 tới
   ngưỡng xem lại thì gộp chính thức lúc supersede.
3. **Năm câu hỏi mở của bản đồ chốt theo đề xuất:** (a) nợ C2 một-cửa-ghi
   per-process giải ở PBI riêng trước STR6 fan-out, không chặn STR15; (b) xử lý L5
   như trên; (c) `dispatch.mjs` giữ một file ở Infra, chỉ tách khi STR8/STR16 đòi;
   (d) C1 envelope đợi STR14; (e) registry-manifest + 2 phép kiểm máy (chiều
   import + đủ sổ) là **PBI STR20, đứng trước S2-friction**.
4. Bản đồ nối vào đường đọc chuẩn: `docs/specs/reading-map.md` + mục lục README.
   Tài liệu bàn luận gốc ở xưởng hạ thành thinking record.
```

### Full target shown text

```text
1. **`docs/architecture-map.md` v0.2 là bản chuẩn kiến trúc của fgOS.** Khung
   chính: 5 tầng `Entry → Use-case → Infra → Domain → Kernel`, phụ thuộc một
   chiều xuống (được nhảy tầng), đo trên đồ thị import thật. Host Adapter là ổ
   cắm (port + config), không phải tầng import. Hai lớp phủ: physics (5 từ dành
   riêng `store/event/state/signal/run`) và authority (6 vai). Hai sổ đăng ký:
   component (14/14 module, tách row component/slice) và contract (C1–C9).
2. **Nghi thức "thẻ căn cước trước code"** (map §9.1) có hiệu lực như **phụ lục
   definition-of-done**: một module/slice mới phải có row trong sổ §6 trước khi
   có code. Không sửa văn bản luật L5 tại chỗ, không mở luật mới — khi L5 tới
   ngưỡng xem lại thì gộp chính thức lúc supersede.
3. **Năm câu hỏi mở của bản đồ chốt theo đề xuất:** (a) nợ C2 một-cửa-ghi
   per-process giải ở PBI riêng trước STR6 fan-out, không chặn STR15; (b) xử lý L5
   như trên; (c) `dispatch.mjs` giữ một file ở Infra, chỉ tách khi STR8/STR16 đòi;
   (d) C1 envelope đợi STR14; (e) registry-manifest + 2 phép kiểm máy (chiều
   import + đủ sổ) là **PBI STR20, đứng trước S2-friction**.
4. Bản đồ nối vào đường đọc chuẩn: `docs/specs/reading-map.md` + mục lục README.
   Tài liệu bàn luận gốc ở xưởng hạ thành thinking record.
```

### Unified diff

```diff
No text difference.
```

## claim_09c8a0450eb9a4c11372dc71dc861376

Source: `docs/architecture-map.md#hệ-quả`. Target: `docs/platform/architecture-map.md#hệ-quả`.

Mechanical class: Judgment. Source digest: `ea2b07f931bce54f5b39835c6b00d823c14df0cbcff727e0dc9f3492a0932f86`. Target digest: `0ffe8d51b6d5fdbd29feb75674e5e04d17642525098a54cf310617a25dea9eac`.

Full shown source SHA256: `3a1f46cac66c549286f552da5c3bbe16a4ccffa4fba244e897f5954aa34dee23`. Full shown target SHA256: `c7274a1269fdccaf8175a237643db3b0054999391c2e74ae440a118c00c4067d`.

### Proposed decision

```json
{
  "claimId": "claim_09c8a0450eb9a4c11372dc71dc861376",
  "sourceUnitDigest": "ea2b07f931bce54f5b39835c6b00d823c14df0cbcff727e0dc9f3492a0932f86",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "hệ-quả",
  "targetUnitDigest": "0ffe8d51b6d5fdbd29feb75674e5e04d17642525098a54cf310617a25dea9eac",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0010 — Bản đồ kiến trúc là bản chuẩn"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architecture-map.md#hệ-quả (lines 625–625) into docs/platform/architecture-map.md#hệ-quả (lines 702–702), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
#### Hệ quả

- Mọi feature mới đi qua nghi thức 3 bước của map §9 trong exploring/planning;
  registry không drift vì STR20 giao cho máy giữ (verify đỏ khi import ngược tầng
  hoặc file thiếu row).
- Đổi bản đồ = decision record mới supersede 0010 + nâng version, không sửa ngầm.
- Nợ có tên còn mở: C2 cross-process lease (trước STR6), C6 designed-chưa-code,
  C3 partial (3 field RUN_CONTRACT vay khi fan-out).
```

### Full target shown text

```text
###### Hệ quả

- Mọi feature mới đi qua nghi thức 3 bước của map §9 trong exploring/planning;
  registry không drift vì STR20 giao cho máy giữ (verify đỏ khi import ngược tầng
  hoặc file thiếu row).
- Đổi bản đồ = decision record mới supersede 0010 + nâng version, không sửa ngầm.
- Nợ có tên còn mở: C2 cross-process lease (trước STR6), C6 designed-chưa-code,
  C3 partial (3 field RUN_CONTRACT vay khi fan-out).
```

### Unified diff

```diff
--- docs/architecture-map.md#hệ-quả
+++ docs/platform/architecture-map.md#hệ-quả
@@ -1,4 +1,4 @@
-#### Hệ quả
+###### Hệ quả
 
 - Mọi feature mới đi qua nghi thức 3 bước của map §9 trong exploring/planning;
   registry không drift vì STR20 giao cho máy giữ (verify đỏ khi import ngược tầng

```

## claim_9f257bfad56f10634ea68e690e6b293e

Source: `docs/architecture-map.md#unheaded-block-72`. Target: `docs/platform/architecture-map.md#unheaded-block-86`.

Mechanical class: Weak-exact. Source digest: `a282068aced9fa7cf371dd6a23f95c4c80a21900965da3c57c18f8f999c39907`. Target digest: `a282068aced9fa7cf371dd6a23f95c4c80a21900965da3c57c18f8f999c39907`.

Full shown source SHA256: `a282068aced9fa7cf371dd6a23f95c4c80a21900965da3c57c18f8f999c39907`. Full shown target SHA256: `a282068aced9fa7cf371dd6a23f95c4c80a21900965da3c57c18f8f999c39907`.

### Proposed decision

```json
{
  "claimId": "claim_9f257bfad56f10634ea68e690e6b293e",
  "sourceUnitDigest": "a282068aced9fa7cf371dd6a23f95c4c80a21900965da3c57c18f8f999c39907",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "unheaded-block-86",
  "targetUnitDigest": "a282068aced9fa7cf371dd6a23f95c4c80a21900965da3c57c18f8f999c39907",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0010 — Bản đồ kiến trúc là bản chuẩn",
    "Hệ quả"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-72 (lines 627–632) into docs/platform/architecture-map.md#unheaded-block-86 (lines 704–709), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- Mọi feature mới đi qua nghi thức 3 bước của map §9 trong exploring/planning;
  registry không drift vì STR20 giao cho máy giữ (verify đỏ khi import ngược tầng
  hoặc file thiếu row).
- Đổi bản đồ = decision record mới supersede 0010 + nâng version, không sửa ngầm.
- Nợ có tên còn mở: C2 cross-process lease (trước STR6), C6 designed-chưa-code,
  C3 partial (3 field RUN_CONTRACT vay khi fan-out).
```

### Full target shown text

```text
- Mọi feature mới đi qua nghi thức 3 bước của map §9 trong exploring/planning;
  registry không drift vì STR20 giao cho máy giữ (verify đỏ khi import ngược tầng
  hoặc file thiếu row).
- Đổi bản đồ = decision record mới supersede 0010 + nâng version, không sửa ngầm.
- Nợ có tên còn mở: C2 cross-process lease (trước STR6), C6 designed-chưa-code,
  C3 partial (3 field RUN_CONTRACT vay khi fan-out).
```

### Unified diff

```diff
No text difference.
```

## claim_c9b5efd58eee31775ccb7a3a95a675b9

Source: `docs/architecture-map.md#0015-đổi-tên-định-danh-contract-c1-c9-thành-ctr001-ctr009`. Target: `docs/platform/architecture-map.md#0015-đổi-tên-định-danh-contract-c1-c9-thành-ctr001-ctr009`.

Mechanical class: Judgment. Source digest: `6cdca6992f8ba23cec169622b22c9a75d358e57f3d253516e79103da6f0e2eb3`. Target digest: `c042446e9b325f9abb4ccef4675f374ef572de3a9afdcbc4e4feeb746fdadc92`.

Full shown source SHA256: `6ba76ff370ef8fe30ceae6907b9808e195a356b2e14863cb4997c1d0397a67e2`. Full shown target SHA256: `ff0027e1775d1301a073224f7421e03a2967d73c7054bde21eeba4dd4790113e`.

### Proposed decision

```json
{
  "claimId": "claim_c9b5efd58eee31775ccb7a3a95a675b9",
  "sourceUnitDigest": "6cdca6992f8ba23cec169622b22c9a75d358e57f3d253516e79103da6f0e2eb3",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "0015-đổi-tên-định-danh-contract-c1-c9-thành-ctr001-ctr009",
  "targetUnitDigest": "c042446e9b325f9abb4ccef4675f374ef572de3a9afdcbc4e4feeb746fdadc92",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architecture-map.md#0015-đổi-tên-định-danh-contract-c1-c9-thành-ctr001-ctr009 (lines 634–634) into docs/platform/architecture-map.md#0015-đổi-tên-định-danh-contract-c1-c9-thành-ctr001-ctr009 (lines 711–711), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
### 0015 — Đổi tên định danh contract C1-C9 thành CTR001-CTR009
```

### Full target shown text

```text
##### 0015 — Đổi tên định danh contract C1-C9 thành CTR001-CTR009
```

### Unified diff

```diff
--- docs/architecture-map.md#0015-đổi-tên-định-danh-contract-c1-c9-thành-ctr001-ctr009
+++ docs/platform/architecture-map.md#0015-đổi-tên-định-danh-contract-c1-c9-thành-ctr001-ctr009
@@ -1 +1 @@
-### 0015 — Đổi tên định danh contract C1-C9 thành CTR001-CTR009
+##### 0015 — Đổi tên định danh contract C1-C9 thành CTR001-CTR009

```

## claim_facf53c13cb93d580976c5f07bf16c36

Source: `docs/architecture-map.md#bối-cảnh-1`. Target: `docs/platform/architecture-map.md#bối-cảnh-1`.

Mechanical class: Judgment. Source digest: `fc627f798834e44fa464d38ea60611957a081c5332e01ca67406494e1efd3199`. Target digest: `fcb3fbc2dd0ae4d362690dca486a4f0b2b7ebaa2b70783d665c6e5da96b671f2`.

Full shown source SHA256: `6d45a15c864717b5c48e2b2a0495d647040ab56153b16680960eeabb1700f2a1`. Full shown target SHA256: `6a4f152f685f5f038d6d3e93e9f6a4951bb989dd94b1b93288f1f2902ce2fdbd`.

### Proposed decision

```json
{
  "claimId": "claim_facf53c13cb93d580976c5f07bf16c36",
  "sourceUnitDigest": "fc627f798834e44fa464d38ea60611957a081c5332e01ca67406494e1efd3199",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "bối-cảnh-1",
  "targetUnitDigest": "fcb3fbc2dd0ae4d362690dca486a4f0b2b7ebaa2b70783d665c6e5da96b671f2",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0015 — Đổi tên định danh contract C1-C9 thành CTR001-CTR009"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architecture-map.md#bối-cảnh-1 (lines 636–636) into docs/platform/architecture-map.md#bối-cảnh-1 (lines 713–713), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
#### Bối cảnh

`docs/id-systems-audit.md` (STR47) rà soát toàn bộ hệ đặt tên/đánh mã đang chạy
song song trong repo và phát hiện contract registry (`architecture-map.md`
§7) là hệ duy nhất còn dùng định danh một-chữ-cái-trần (`C1`-`C9`) — khác mọi
hệ đã có tiền tố 3-chữ tự khai type (`TSK`, `ADR`, `RUL`, `STR`). Một định
danh trần như `C2` không tự nói nó là contract khi xuất hiện lẻ trong chat,
git diff, hay log — người đọc phải tra ngược ngữ cảnh. Audit #6 chốt hướng
đổi sang tiền tố `CTR` (contract), cùng quy ước 3-digit zero-pad với `RUL<n>`
(ví dụ `RUL042`) để số lượng contract có thể vượt quá 9 mà không đổi độ rộng
định danh giữa chừng — ví dụ khoá trong audit: `CTR009`.

Backlog `STR54` submit hướng này thành việc thi công cụ thể: đổi mọi citation
`C1`-`C9` genuine trong 7 file + `architecture-map.md` chính nó, không đổi ý
nghĩa/ranh giới/maturity của bất kỳ contract nào.
```

### Full target shown text

```text
###### Bối cảnh

`docs/id-systems-audit.md` (STR47) rà soát toàn bộ hệ đặt tên/đánh mã đang chạy
song song trong repo và phát hiện contract registry (`architecture-map.md`
§7) là hệ duy nhất còn dùng định danh một-chữ-cái-trần (`C1`-`C9`) — khác mọi
hệ đã có tiền tố 3-chữ tự khai type (`TSK`, `ADR`, `RUL`, `STR`). Một định
danh trần như `C2` không tự nói nó là contract khi xuất hiện lẻ trong chat,
git diff, hay log — người đọc phải tra ngược ngữ cảnh. Audit #6 chốt hướng
đổi sang tiền tố `CTR` (contract), cùng quy ước 3-digit zero-pad với `RUL<n>`
(ví dụ `RUL042`) để số lượng contract có thể vượt quá 9 mà không đổi độ rộng
định danh giữa chừng — ví dụ khoá trong audit: `CTR009`.

Backlog `STR54` submit hướng này thành việc thi công cụ thể: đổi mọi citation
`C1`-`C9` genuine trong 7 file + `architecture-map.md` chính nó, không đổi ý
nghĩa/ranh giới/maturity của bất kỳ contract nào.
```

### Unified diff

```diff
--- docs/architecture-map.md#bối-cảnh-1
+++ docs/platform/architecture-map.md#bối-cảnh-1
@@ -1,4 +1,4 @@
-#### Bối cảnh
+###### Bối cảnh
 
 `docs/id-systems-audit.md` (STR47) rà soát toàn bộ hệ đặt tên/đánh mã đang chạy
 song song trong repo và phát hiện contract registry (`architecture-map.md`

```

## claim_dd57a5a91e11145ed11858fe9f03feb7

Source: `docs/architecture-map.md#unheaded-block-73`. Target: `docs/platform/architecture-map.md#unheaded-block-87`.

Mechanical class: Weak-exact. Source digest: `5db60ba6149afed521832ded34c1cf5366d61c0eb0e97b8eea7c489c080d9cee`. Target digest: `5db60ba6149afed521832ded34c1cf5366d61c0eb0e97b8eea7c489c080d9cee`.

Full shown source SHA256: `5db60ba6149afed521832ded34c1cf5366d61c0eb0e97b8eea7c489c080d9cee`. Full shown target SHA256: `5db60ba6149afed521832ded34c1cf5366d61c0eb0e97b8eea7c489c080d9cee`.

### Proposed decision

```json
{
  "claimId": "claim_dd57a5a91e11145ed11858fe9f03feb7",
  "sourceUnitDigest": "5db60ba6149afed521832ded34c1cf5366d61c0eb0e97b8eea7c489c080d9cee",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "unheaded-block-87",
  "targetUnitDigest": "5db60ba6149afed521832ded34c1cf5366d61c0eb0e97b8eea7c489c080d9cee",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0015 — Đổi tên định danh contract C1-C9 thành CTR001-CTR009",
    "Bối cảnh"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-73 (lines 638–646) into docs/platform/architecture-map.md#unheaded-block-87 (lines 715–723), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
`docs/id-systems-audit.md` (STR47) rà soát toàn bộ hệ đặt tên/đánh mã đang chạy
song song trong repo và phát hiện contract registry (`architecture-map.md`
§7) là hệ duy nhất còn dùng định danh một-chữ-cái-trần (`C1`-`C9`) — khác mọi
hệ đã có tiền tố 3-chữ tự khai type (`TSK`, `ADR`, `RUL`, `STR`). Một định
danh trần như `C2` không tự nói nó là contract khi xuất hiện lẻ trong chat,
git diff, hay log — người đọc phải tra ngược ngữ cảnh. Audit #6 chốt hướng
đổi sang tiền tố `CTR` (contract), cùng quy ước 3-digit zero-pad với `RUL<n>`
(ví dụ `RUL042`) để số lượng contract có thể vượt quá 9 mà không đổi độ rộng
định danh giữa chừng — ví dụ khoá trong audit: `CTR009`.
```

### Full target shown text

```text
`docs/id-systems-audit.md` (STR47) rà soát toàn bộ hệ đặt tên/đánh mã đang chạy
song song trong repo và phát hiện contract registry (`architecture-map.md`
§7) là hệ duy nhất còn dùng định danh một-chữ-cái-trần (`C1`-`C9`) — khác mọi
hệ đã có tiền tố 3-chữ tự khai type (`TSK`, `ADR`, `RUL`, `STR`). Một định
danh trần như `C2` không tự nói nó là contract khi xuất hiện lẻ trong chat,
git diff, hay log — người đọc phải tra ngược ngữ cảnh. Audit #6 chốt hướng
đổi sang tiền tố `CTR` (contract), cùng quy ước 3-digit zero-pad với `RUL<n>`
(ví dụ `RUL042`) để số lượng contract có thể vượt quá 9 mà không đổi độ rộng
định danh giữa chừng — ví dụ khoá trong audit: `CTR009`.
```

### Unified diff

```diff
No text difference.
```

## claim_ef4ca79419892042710d7b1fdf930c56

Source: `docs/architecture-map.md#unheaded-block-74`. Target: `docs/platform/architecture-map.md#unheaded-block-88`.

Mechanical class: Weak-exact. Source digest: `7219a80f915370e6a8a4714792dc020bddaacc39f62821019ba5b1cdabdb33d6`. Target digest: `7219a80f915370e6a8a4714792dc020bddaacc39f62821019ba5b1cdabdb33d6`.

Full shown source SHA256: `7219a80f915370e6a8a4714792dc020bddaacc39f62821019ba5b1cdabdb33d6`. Full shown target SHA256: `7219a80f915370e6a8a4714792dc020bddaacc39f62821019ba5b1cdabdb33d6`.

### Proposed decision

```json
{
  "claimId": "claim_ef4ca79419892042710d7b1fdf930c56",
  "sourceUnitDigest": "7219a80f915370e6a8a4714792dc020bddaacc39f62821019ba5b1cdabdb33d6",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "unheaded-block-88",
  "targetUnitDigest": "7219a80f915370e6a8a4714792dc020bddaacc39f62821019ba5b1cdabdb33d6",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0015 — Đổi tên định danh contract C1-C9 thành CTR001-CTR009",
    "Bối cảnh"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-74 (lines 648–650) into docs/platform/architecture-map.md#unheaded-block-88 (lines 725–727), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Backlog `STR54` submit hướng này thành việc thi công cụ thể: đổi mọi citation
`C1`-`C9` genuine trong 7 file + `architecture-map.md` chính nó, không đổi ý
nghĩa/ranh giới/maturity của bất kỳ contract nào.
```

### Full target shown text

```text
Backlog `STR54` submit hướng này thành việc thi công cụ thể: đổi mọi citation
`C1`-`C9` genuine trong 7 file + `architecture-map.md` chính nó, không đổi ý
nghĩa/ranh giới/maturity của bất kỳ contract nào.
```

### Unified diff

```diff
No text difference.
```

## claim_e1ec652c882728067e70a1e31373e8f1

Source: `docs/architecture-map.md#quyết-định-1`. Target: `docs/platform/architecture-map.md#quyết-định-1`.

Mechanical class: Judgment. Source digest: `ccae5bf0300e22a5a337ee36b115e48709ad46928a50cee4d55ef453a1fbe87b`. Target digest: `7ae40818f7c0be1982db79d04ea00a6110a4b1f2db96bae4d948a93fccdc25e9`.

Full shown source SHA256: `b249161380f22202583dc4806aad745f7e670cd5a76c92e4cd552730fd14fec6`. Full shown target SHA256: `f997993268d88b84f5b7a09e82093f8b7e0423c67b5462238e6a1689a6698971`.

### Proposed decision

```json
{
  "claimId": "claim_e1ec652c882728067e70a1e31373e8f1",
  "sourceUnitDigest": "ccae5bf0300e22a5a337ee36b115e48709ad46928a50cee4d55ef453a1fbe87b",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "quyết-định-1",
  "targetUnitDigest": "7ae40818f7c0be1982db79d04ea00a6110a4b1f2db96bae4d948a93fccdc25e9",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0015 — Đổi tên định danh contract C1-C9 thành CTR001-CTR009"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architecture-map.md#quyết-định-1 (lines 652–652) into docs/platform/architecture-map.md#quyết-định-1 (lines 729–729), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
#### Quyết định

1. **Định danh contract đổi từ `C<n>` (một chữ số, không pad) sang `CTR<n>`
   3-digit zero-padded** — `C1` → `CTR001`, …, `C9` → `CTR009`. Tiền tố `CTR`
   bake-in type vào chính chuỗi id, tự khai "đây là contract" ở mọi nơi id
   xuất hiện, không phụ thuộc tầng hiển thị nào ghép nhãn hộ.
2. **Đây là đổi tên thuần (rename), không đổi nghĩa.** `CTR001` là cùng một
   contract với `C1` trước đây — cùng ranh giới, cùng hợp đồng, cùng
   maturity. Không có contract nào được thêm/bớt/định nghĩa lại bởi record
   này.
3. **`architecture-map.md` là bản chuẩn (record 0010) của registry này** —
   đổi tên áp dụng trước tiên ở đó (§6, §7, hai sơ đồ mermaid, changelog,
   câu hỏi mở), theo đúng nghi thức đổi bản đồ của chính nó (§9 luật 5: qua
   decision record + nâng version, không sửa ngầm) — nâng v0.4 → v0.5.
4. **Mọi nơi khác cite `C1`-`C9`** (specs, `platform-foundations.md`,
   `docs/decisions/0000-index.md`, `docs/backlog.md`) đổi theo cùng quy ước,
   trừ các chỗ đã xác nhận không phải citation của registry này (ví dụ một
   bảng verdict nội bộ không liên quan dùng trùng ký hiệu `C1`/`C2`/`C3`) —
   những chỗ đó giữ nguyên, không đổi.
```

### Full target shown text

```text
###### Quyết định

1. **Định danh contract đổi từ `C<n>` (một chữ số, không pad) sang `CTR<n>`
   3-digit zero-padded** — `C1` → `CTR001`, …, `C9` → `CTR009`. Tiền tố `CTR`
   bake-in type vào chính chuỗi id, tự khai "đây là contract" ở mọi nơi id
   xuất hiện, không phụ thuộc tầng hiển thị nào ghép nhãn hộ.
2. **Đây là đổi tên thuần (rename), không đổi nghĩa.** `CTR001` là cùng một
   contract với `C1` trước đây — cùng ranh giới, cùng hợp đồng, cùng
   maturity. Không có contract nào được thêm/bớt/định nghĩa lại bởi record
   này.
3. **`architecture-map.md` là bản chuẩn (record 0010) của registry này** —
   đổi tên áp dụng trước tiên ở đó (§6, §7, hai sơ đồ mermaid, changelog,
   câu hỏi mở), theo đúng nghi thức đổi bản đồ của chính nó (§9 luật 5: qua
   decision record + nâng version, không sửa ngầm) — nâng v0.4 → v0.5.
4. **Mọi nơi khác cite `C1`-`C9`** (specs, `platform-foundations.md`,
   `docs/decisions/0000-index.md`, `docs/backlog.md`) đổi theo cùng quy ước,
   trừ các chỗ đã xác nhận không phải citation của registry này (ví dụ một
   bảng verdict nội bộ không liên quan dùng trùng ký hiệu `C1`/`C2`/`C3`) —
   những chỗ đó giữ nguyên, không đổi.
```

### Unified diff

```diff
--- docs/architecture-map.md#quyết-định-1
+++ docs/platform/architecture-map.md#quyết-định-1
@@ -1,4 +1,4 @@
-#### Quyết định
+###### Quyết định
 
 1. **Định danh contract đổi từ `C<n>` (một chữ số, không pad) sang `CTR<n>`
    3-digit zero-padded** — `C1` → `CTR001`, …, `C9` → `CTR009`. Tiền tố `CTR`

```

## claim_15dcb04741ead9bc3a3d2ded61d95439

Source: `docs/architecture-map.md#unheaded-block-75`. Target: `docs/platform/architecture-map.md#unheaded-block-89`.

Mechanical class: Weak-exact. Source digest: `52e715697820786d3f2dbb36c2d8ce6bc7f91fc949b5727a45ace623825e8677`. Target digest: `52e715697820786d3f2dbb36c2d8ce6bc7f91fc949b5727a45ace623825e8677`.

Full shown source SHA256: `52e715697820786d3f2dbb36c2d8ce6bc7f91fc949b5727a45ace623825e8677`. Full shown target SHA256: `52e715697820786d3f2dbb36c2d8ce6bc7f91fc949b5727a45ace623825e8677`.

### Proposed decision

```json
{
  "claimId": "claim_15dcb04741ead9bc3a3d2ded61d95439",
  "sourceUnitDigest": "52e715697820786d3f2dbb36c2d8ce6bc7f91fc949b5727a45ace623825e8677",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "unheaded-block-89",
  "targetUnitDigest": "52e715697820786d3f2dbb36c2d8ce6bc7f91fc949b5727a45ace623825e8677",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0015 — Đổi tên định danh contract C1-C9 thành CTR001-CTR009",
    "Quyết định"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-75 (lines 654–670) into docs/platform/architecture-map.md#unheaded-block-89 (lines 731–747), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
1. **Định danh contract đổi từ `C<n>` (một chữ số, không pad) sang `CTR<n>`
   3-digit zero-padded** — `C1` → `CTR001`, …, `C9` → `CTR009`. Tiền tố `CTR`
   bake-in type vào chính chuỗi id, tự khai "đây là contract" ở mọi nơi id
   xuất hiện, không phụ thuộc tầng hiển thị nào ghép nhãn hộ.
2. **Đây là đổi tên thuần (rename), không đổi nghĩa.** `CTR001` là cùng một
   contract với `C1` trước đây — cùng ranh giới, cùng hợp đồng, cùng
   maturity. Không có contract nào được thêm/bớt/định nghĩa lại bởi record
   này.
3. **`architecture-map.md` là bản chuẩn (record 0010) của registry này** —
   đổi tên áp dụng trước tiên ở đó (§6, §7, hai sơ đồ mermaid, changelog,
   câu hỏi mở), theo đúng nghi thức đổi bản đồ của chính nó (§9 luật 5: qua
   decision record + nâng version, không sửa ngầm) — nâng v0.4 → v0.5.
4. **Mọi nơi khác cite `C1`-`C9`** (specs, `platform-foundations.md`,
   `docs/decisions/0000-index.md`, `docs/backlog.md`) đổi theo cùng quy ước,
   trừ các chỗ đã xác nhận không phải citation của registry này (ví dụ một
   bảng verdict nội bộ không liên quan dùng trùng ký hiệu `C1`/`C2`/`C3`) —
   những chỗ đó giữ nguyên, không đổi.
```

### Full target shown text

```text
1. **Định danh contract đổi từ `C<n>` (một chữ số, không pad) sang `CTR<n>`
   3-digit zero-padded** — `C1` → `CTR001`, …, `C9` → `CTR009`. Tiền tố `CTR`
   bake-in type vào chính chuỗi id, tự khai "đây là contract" ở mọi nơi id
   xuất hiện, không phụ thuộc tầng hiển thị nào ghép nhãn hộ.
2. **Đây là đổi tên thuần (rename), không đổi nghĩa.** `CTR001` là cùng một
   contract với `C1` trước đây — cùng ranh giới, cùng hợp đồng, cùng
   maturity. Không có contract nào được thêm/bớt/định nghĩa lại bởi record
   này.
3. **`architecture-map.md` là bản chuẩn (record 0010) của registry này** —
   đổi tên áp dụng trước tiên ở đó (§6, §7, hai sơ đồ mermaid, changelog,
   câu hỏi mở), theo đúng nghi thức đổi bản đồ của chính nó (§9 luật 5: qua
   decision record + nâng version, không sửa ngầm) — nâng v0.4 → v0.5.
4. **Mọi nơi khác cite `C1`-`C9`** (specs, `platform-foundations.md`,
   `docs/decisions/0000-index.md`, `docs/backlog.md`) đổi theo cùng quy ước,
   trừ các chỗ đã xác nhận không phải citation của registry này (ví dụ một
   bảng verdict nội bộ không liên quan dùng trùng ký hiệu `C1`/`C2`/`C3`) —
   những chỗ đó giữ nguyên, không đổi.
```

### Unified diff

```diff
No text difference.
```

## claim_e191cbbce5d4f83c78026363188c4bf6

Source: `docs/architecture-map.md#hệ-quả-1`. Target: `docs/platform/architecture-map.md#hệ-quả-1`.

Mechanical class: Judgment. Source digest: `104d3db24e940600d3d01448819602c9d162daf8a93517712af97177fb8daee5`. Target digest: `dba7adee03b9c7c868f8c2f364acfc3e22759737449c94ce87d5fa27415945e7`.

Full shown source SHA256: `5ca7f6987225f69c11b997a0f63b1c29e4af3f0e0a4caedfbed4a9ce17bbb528`. Full shown target SHA256: `d071138079e435307137b126d5d8993387fd79734e2f6d76c57e7f568064f5d8`.

### Proposed decision

```json
{
  "claimId": "claim_e191cbbce5d4f83c78026363188c4bf6",
  "sourceUnitDigest": "104d3db24e940600d3d01448819602c9d162daf8a93517712af97177fb8daee5",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "hệ-quả-1",
  "targetUnitDigest": "dba7adee03b9c7c868f8c2f364acfc3e22759737449c94ce87d5fa27415945e7",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0015 — Đổi tên định danh contract C1-C9 thành CTR001-CTR009"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architecture-map.md#hệ-quả-1 (lines 672–672) into docs/platform/architecture-map.md#hệ-quả-1 (lines 749–749), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
#### Hệ quả

- **0010 không bị supersede** — 0015 chỉ đổi cách viết định danh của registry
  đã khoá ở 0010, không đổi cấu trúc hay nội dung registry.
- **Không đổi schema, không đổi code** — đây là rename thuần văn bản trong
  tài liệu; không có contract nào đổi hành vi.
- **Nhất quán với các hệ đã đổi trước đó** (`TSK<hash>` cho work id, `ADR<n>`
  cho decision record, `RUL<n>` cho business rule) — hoàn tất mảnh #6 trong
  bảng audit `id-systems-audit.md`.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target shown text

```text
###### Hệ quả

- **0010 không bị supersede** — 0015 chỉ đổi cách viết định danh của registry
  đã khoá ở 0010, không đổi cấu trúc hay nội dung registry.
- **Không đổi schema, không đổi code** — đây là rename thuần văn bản trong
  tài liệu; không có contract nào đổi hành vi.
- **Nhất quán với các hệ đã đổi trước đó** (`TSK<hash>` cho work id, `ADR<n>`
  cho decision record, `RUL<n>` cho business rule) — hoàn tất mảnh #6 trong
  bảng audit `id-systems-audit.md`.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Unified diff

```diff
--- docs/architecture-map.md#hệ-quả-1
+++ docs/platform/architecture-map.md#hệ-quả-1
@@ -1,4 +1,4 @@
-#### Hệ quả
+###### Hệ quả
 
 - **0010 không bị supersede** — 0015 chỉ đổi cách viết định danh của registry
   đã khoá ở 0010, không đổi cấu trúc hay nội dung registry.

```

## claim_2d4c69a3c963e28c172200df0c641de4

Source: `docs/architecture-map.md#unheaded-block-76`. Target: `docs/platform/architecture-map.md#unheaded-block-90`.

Mechanical class: Weak-exact. Source digest: `35a06dabde538a28c7d1f33814e49318f975ead6273b8d0c2a64644387c9fe42`. Target digest: `35a06dabde538a28c7d1f33814e49318f975ead6273b8d0c2a64644387c9fe42`.

Full shown source SHA256: `35a06dabde538a28c7d1f33814e49318f975ead6273b8d0c2a64644387c9fe42`. Full shown target SHA256: `35a06dabde538a28c7d1f33814e49318f975ead6273b8d0c2a64644387c9fe42`.

### Proposed decision

```json
{
  "claimId": "claim_2d4c69a3c963e28c172200df0c641de4",
  "sourceUnitDigest": "35a06dabde538a28c7d1f33814e49318f975ead6273b8d0c2a64644387c9fe42",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "unheaded-block-90",
  "targetUnitDigest": "35a06dabde538a28c7d1f33814e49318f975ead6273b8d0c2a64644387c9fe42",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0015 — Đổi tên định danh contract C1-C9 thành CTR001-CTR009",
    "Hệ quả"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-76 (lines 674–680) into docs/platform/architecture-map.md#unheaded-block-90 (lines 751–757), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- **0010 không bị supersede** — 0015 chỉ đổi cách viết định danh của registry
  đã khoá ở 0010, không đổi cấu trúc hay nội dung registry.
- **Không đổi schema, không đổi code** — đây là rename thuần văn bản trong
  tài liệu; không có contract nào đổi hành vi.
- **Nhất quán với các hệ đã đổi trước đó** (`TSK<hash>` cho work id, `ADR<n>`
  cho decision record, `RUL<n>` cho business rule) — hoàn tất mảnh #6 trong
  bảng audit `id-systems-audit.md`.
```

### Full target shown text

```text
- **0010 không bị supersede** — 0015 chỉ đổi cách viết định danh của registry
  đã khoá ở 0010, không đổi cấu trúc hay nội dung registry.
- **Không đổi schema, không đổi code** — đây là rename thuần văn bản trong
  tài liệu; không có contract nào đổi hành vi.
- **Nhất quán với các hệ đã đổi trước đó** (`TSK<hash>` cho work id, `ADR<n>`
  cho decision record, `RUL<n>` cho business rule) — hoàn tất mảnh #6 trong
  bảng audit `id-systems-audit.md`.
```

### Unified diff

```diff
No text difference.
```

## claim_f7e282b47557154231f0565bd30e5d7d

Source: `docs/architecture-map.md#unheaded-block-77`. Target: `docs/platform/architecture-map.md#unheaded-block-91`.

Mechanical class: Weak-exact. Source digest: `95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104`. Target digest: `95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104`.

Full shown source SHA256: `95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104`. Full shown target SHA256: `95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104`.

### Proposed decision

```json
{
  "claimId": "claim_f7e282b47557154231f0565bd30e5d7d",
  "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "unheaded-block-91",
  "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0015 — Đổi tên định danh contract C1-C9 thành CTR001-CTR009",
    "Hệ quả"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: target digest repeats; ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-77 (lines 682–682) into docs/platform/architecture-map.md#unheaded-block-91 (lines 759–759), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target shown text

```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Unified diff

```diff
No text difference.
```

## claim_f6e78a761339fea3ff5b51a76f7ca1fa

Source: `docs/architecture-map.md#0017-đóng-audit-hệ-idtên-gọi-str47`. Target: `docs/platform/architecture-map.md#0017-đóng-audit-hệ-idtên-gọi-str47`.

Mechanical class: Judgment. Source digest: `e8f57fc43b85c0af00d3946c1d6c879accbe652a79b429c49c1cfe52658c82e8`. Target digest: `7873c7592e67f6f269cfdfdf3507423222a9e3fe4b4ea1935ad4a666020d7a52`.

Full shown source SHA256: `c9453e14ce9d7e2faed59a9c27c300a2aea1eaa896b8574c31db6d451a46362d`. Full shown target SHA256: `a547f45d60334db75c448b83c614a3ff3be0457e244cc1d4ceaf407ca7657957`.

### Proposed decision

```json
{
  "claimId": "claim_f6e78a761339fea3ff5b51a76f7ca1fa",
  "sourceUnitDigest": "e8f57fc43b85c0af00d3946c1d6c879accbe652a79b429c49c1cfe52658c82e8",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "0017-đóng-audit-hệ-idtên-gọi-str47",
  "targetUnitDigest": "7873c7592e67f6f269cfdfdf3507423222a9e3fe4b4ea1935ad4a666020d7a52",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architecture-map.md#0017-đóng-audit-hệ-idtên-gọi-str47 (lines 684–684) into docs/platform/architecture-map.md#0017-đóng-audit-hệ-idtên-gọi-str47 (lines 761–761), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
### 0017 — Đóng audit hệ id/tên gọi (STR47)
```

### Full target shown text

```text
##### 0017 — Đóng audit hệ id/tên gọi (STR47)
```

### Unified diff

```diff
--- docs/architecture-map.md#0017-đóng-audit-hệ-idtên-gọi-str47
+++ docs/platform/architecture-map.md#0017-đóng-audit-hệ-idtên-gọi-str47
@@ -1 +1 @@
-### 0017 — Đóng audit hệ id/tên gọi (STR47)
+##### 0017 — Đóng audit hệ id/tên gọi (STR47)

```

## claim_cdbd65b487c20e2518c8b4fc4f3f9d21

Source: `docs/architecture-map.md#bối-cảnh-2`. Target: `docs/platform/architecture-map.md#bối-cảnh-2`.

Mechanical class: Judgment. Source digest: `40c97e055534e1b0a433ed57afd01548e3052e89792ec7a9d2c45a4f15146ad0`. Target digest: `ab5309ef4d12375f20cd4315a60d1d1a9c95cf8a2dc3143cd58c371324d9fb8a`.

Full shown source SHA256: `c2fa936fc0203265b7b16ca11abb221f538a8a64bc69480e3294205d400fb6d3`. Full shown target SHA256: `c7985e72f903f0c64ae66facefeba846fbc34d27490b3b8b677d8027f4c943b9`.

### Proposed decision

```json
{
  "claimId": "claim_cdbd65b487c20e2518c8b4fc4f3f9d21",
  "sourceUnitDigest": "40c97e055534e1b0a433ed57afd01548e3052e89792ec7a9d2c45a4f15146ad0",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "bối-cảnh-2",
  "targetUnitDigest": "ab5309ef4d12375f20cd4315a60d1d1a9c95cf8a2dc3143cd58c371324d9fb8a",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0017 — Đóng audit hệ id/tên gọi (STR47)"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architecture-map.md#bối-cảnh-2 (lines 686–686) into docs/platform/architecture-map.md#bối-cảnh-2 (lines 763–763), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
#### Bối cảnh

`docs/id-systems-audit.md` (STR47, thảo luận đầu 2026-07-18) rà soát 13 hệ
id/tên gọi song song đang sống trong workshop + sản phẩm fgOS, tách thành hai
nhóm: 6 hệ **fgOS — sản phẩm vĩnh viễn** (#1-#6) và 7 hệ **bee — giàn giáo
tạm** (#7-#13), theo khung quyết định `0004-pham-vi-va-non-goal.md` (fgOS
chạy song song, không thay thế bee cho tới ngưỡng-có-tên). Sáu hướng đổi
định dạng mà audit chốt cho nhóm fgOS (#1, #3, #4, #5, #6 — #2 giữ nguyên)
đã lần lượt được submit thành các PBI riêng và thi công xong:

- STR53 — `work.id` bỏ slug, đổi sang `tsk-<hash>`
- STR54 — `C1`-`C9` → `CTR<n>` (decision `0015`)
- STR55 — chuẩn hoá trích dẫn rút gọn ADR → `ADR<n>`
- STR56 — `R#` → `RUL<n>`
- STR57 — Story (đổi tên khỏi "PBI") `P<n>` → `STR<n>`
- STR58 — script `next-doc-id` cho họ "next free integer thủ công"

Cả sáu đều mang trạng thái `done` trong `docs/backlog.md`. Nhóm bee (#7-#10)
— D-hex/D-local shape collision, cell-id, feature slug — chưa từng được bàn
tới điểm chốt trong bản DRAFT 2026-07-18. Record này đóng audit: khoá hướng
cho #7-#10, sửa `id-systems-audit.md` khỏi các chỗ đã trôi khỏi thực tế
shipped (draft viết trước khi STR53-STR58 thi công), và trả lời câu hỏi CoS
gốc của STR47 — giữ đa hệ có chủ đích hay hợp nhất.
```

### Full target shown text

```text
###### Bối cảnh

`docs/id-systems-audit.md` (STR47, thảo luận đầu 2026-07-18) rà soát 13 hệ
id/tên gọi song song đang sống trong workshop + sản phẩm fgOS, tách thành hai
nhóm: 6 hệ **fgOS — sản phẩm vĩnh viễn** (#1-#6) và 7 hệ **bee — giàn giáo
tạm** (#7-#13), theo khung quyết định `0004-pham-vi-va-non-goal.md` (fgOS
chạy song song, không thay thế bee cho tới ngưỡng-có-tên). Sáu hướng đổi
định dạng mà audit chốt cho nhóm fgOS (#1, #3, #4, #5, #6 — #2 giữ nguyên)
đã lần lượt được submit thành các PBI riêng và thi công xong:

- STR53 — `work.id` bỏ slug, đổi sang `tsk-<hash>`
- STR54 — `C1`-`C9` → `CTR<n>` (decision `0015`)
- STR55 — chuẩn hoá trích dẫn rút gọn ADR → `ADR<n>`
- STR56 — `R#` → `RUL<n>`
- STR57 — Story (đổi tên khỏi "PBI") `P<n>` → `STR<n>`
- STR58 — script `next-doc-id` cho họ "next free integer thủ công"

Cả sáu đều mang trạng thái `done` trong `docs/backlog.md`. Nhóm bee (#7-#10)
— D-hex/D-local shape collision, cell-id, feature slug — chưa từng được bàn
tới điểm chốt trong bản DRAFT 2026-07-18. Record này đóng audit: khoá hướng
cho #7-#10, sửa `id-systems-audit.md` khỏi các chỗ đã trôi khỏi thực tế
shipped (draft viết trước khi STR53-STR58 thi công), và trả lời câu hỏi CoS
gốc của STR47 — giữ đa hệ có chủ đích hay hợp nhất.
```

### Unified diff

```diff
--- docs/architecture-map.md#bối-cảnh-2
+++ docs/platform/architecture-map.md#bối-cảnh-2
@@ -1,4 +1,4 @@
-#### Bối cảnh
+###### Bối cảnh
 
 `docs/id-systems-audit.md` (STR47, thảo luận đầu 2026-07-18) rà soát 13 hệ
 id/tên gọi song song đang sống trong workshop + sản phẩm fgOS, tách thành hai

```

## claim_a8a5b93d5356541d527f50adfecd2909

Source: `docs/architecture-map.md#unheaded-block-78`. Target: `docs/platform/architecture-map.md#unheaded-block-92`.

Mechanical class: Weak-exact. Source digest: `d5fc141eedf1aee0332da281d2e68509582f3a2e6c7f5db9e7ff44e121859017`. Target digest: `d5fc141eedf1aee0332da281d2e68509582f3a2e6c7f5db9e7ff44e121859017`.

Full shown source SHA256: `d5fc141eedf1aee0332da281d2e68509582f3a2e6c7f5db9e7ff44e121859017`. Full shown target SHA256: `d5fc141eedf1aee0332da281d2e68509582f3a2e6c7f5db9e7ff44e121859017`.

### Proposed decision

```json
{
  "claimId": "claim_a8a5b93d5356541d527f50adfecd2909",
  "sourceUnitDigest": "d5fc141eedf1aee0332da281d2e68509582f3a2e6c7f5db9e7ff44e121859017",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "unheaded-block-92",
  "targetUnitDigest": "d5fc141eedf1aee0332da281d2e68509582f3a2e6c7f5db9e7ff44e121859017",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0017 — Đóng audit hệ id/tên gọi (STR47)",
    "Bối cảnh"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-78 (lines 688–694) into docs/platform/architecture-map.md#unheaded-block-92 (lines 765–771), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
`docs/id-systems-audit.md` (STR47, thảo luận đầu 2026-07-18) rà soát 13 hệ
id/tên gọi song song đang sống trong workshop + sản phẩm fgOS, tách thành hai
nhóm: 6 hệ **fgOS — sản phẩm vĩnh viễn** (#1-#6) và 7 hệ **bee — giàn giáo
tạm** (#7-#13), theo khung quyết định `0004-pham-vi-va-non-goal.md` (fgOS
chạy song song, không thay thế bee cho tới ngưỡng-có-tên). Sáu hướng đổi
định dạng mà audit chốt cho nhóm fgOS (#1, #3, #4, #5, #6 — #2 giữ nguyên)
đã lần lượt được submit thành các PBI riêng và thi công xong:
```

### Full target shown text

```text
`docs/id-systems-audit.md` (STR47, thảo luận đầu 2026-07-18) rà soát 13 hệ
id/tên gọi song song đang sống trong workshop + sản phẩm fgOS, tách thành hai
nhóm: 6 hệ **fgOS — sản phẩm vĩnh viễn** (#1-#6) và 7 hệ **bee — giàn giáo
tạm** (#7-#13), theo khung quyết định `0004-pham-vi-va-non-goal.md` (fgOS
chạy song song, không thay thế bee cho tới ngưỡng-có-tên). Sáu hướng đổi
định dạng mà audit chốt cho nhóm fgOS (#1, #3, #4, #5, #6 — #2 giữ nguyên)
đã lần lượt được submit thành các PBI riêng và thi công xong:
```

### Unified diff

```diff
No text difference.
```

## claim_bb5eca63aa454e15b1888694289b6188

Source: `docs/architecture-map.md#unheaded-block-79`. Target: `docs/platform/architecture-map.md#unheaded-block-93`.

Mechanical class: Weak-exact. Source digest: `049237aa390992e09cf12c5099b7dfa0eae2356eb46828982eab6c3bfab7005d`. Target digest: `049237aa390992e09cf12c5099b7dfa0eae2356eb46828982eab6c3bfab7005d`.

Full shown source SHA256: `049237aa390992e09cf12c5099b7dfa0eae2356eb46828982eab6c3bfab7005d`. Full shown target SHA256: `049237aa390992e09cf12c5099b7dfa0eae2356eb46828982eab6c3bfab7005d`.

### Proposed decision

```json
{
  "claimId": "claim_bb5eca63aa454e15b1888694289b6188",
  "sourceUnitDigest": "049237aa390992e09cf12c5099b7dfa0eae2356eb46828982eab6c3bfab7005d",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "unheaded-block-93",
  "targetUnitDigest": "049237aa390992e09cf12c5099b7dfa0eae2356eb46828982eab6c3bfab7005d",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0017 — Đóng audit hệ id/tên gọi (STR47)",
    "Bối cảnh"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-79 (lines 696–701) into docs/platform/architecture-map.md#unheaded-block-93 (lines 773–778), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- STR53 — `work.id` bỏ slug, đổi sang `tsk-<hash>`
- STR54 — `C1`-`C9` → `CTR<n>` (decision `0015`)
- STR55 — chuẩn hoá trích dẫn rút gọn ADR → `ADR<n>`
- STR56 — `R#` → `RUL<n>`
- STR57 — Story (đổi tên khỏi "PBI") `P<n>` → `STR<n>`
- STR58 — script `next-doc-id` cho họ "next free integer thủ công"
```

### Full target shown text

```text
- STR53 — `work.id` bỏ slug, đổi sang `tsk-<hash>`
- STR54 — `C1`-`C9` → `CTR<n>` (decision `0015`)
- STR55 — chuẩn hoá trích dẫn rút gọn ADR → `ADR<n>`
- STR56 — `R#` → `RUL<n>`
- STR57 — Story (đổi tên khỏi "PBI") `P<n>` → `STR<n>`
- STR58 — script `next-doc-id` cho họ "next free integer thủ công"
```

### Unified diff

```diff
No text difference.
```

## claim_9e7627a8ce26cfda0b9f13ba75e010de

Source: `docs/architecture-map.md#unheaded-block-80`. Target: `docs/platform/architecture-map.md#unheaded-block-94`.

Mechanical class: Weak-exact. Source digest: `477356b8934572e764cd557b98fcd5b0c47c5119f533a1446569cc0a7c3cb83b`. Target digest: `477356b8934572e764cd557b98fcd5b0c47c5119f533a1446569cc0a7c3cb83b`.

Full shown source SHA256: `477356b8934572e764cd557b98fcd5b0c47c5119f533a1446569cc0a7c3cb83b`. Full shown target SHA256: `477356b8934572e764cd557b98fcd5b0c47c5119f533a1446569cc0a7c3cb83b`.

### Proposed decision

```json
{
  "claimId": "claim_9e7627a8ce26cfda0b9f13ba75e010de",
  "sourceUnitDigest": "477356b8934572e764cd557b98fcd5b0c47c5119f533a1446569cc0a7c3cb83b",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "unheaded-block-94",
  "targetUnitDigest": "477356b8934572e764cd557b98fcd5b0c47c5119f533a1446569cc0a7c3cb83b",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0017 — Đóng audit hệ id/tên gọi (STR47)",
    "Bối cảnh"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-80 (lines 703–708) into docs/platform/architecture-map.md#unheaded-block-94 (lines 780–785), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Cả sáu đều mang trạng thái `done` trong `docs/backlog.md`. Nhóm bee (#7-#10)
— D-hex/D-local shape collision, cell-id, feature slug — chưa từng được bàn
tới điểm chốt trong bản DRAFT 2026-07-18. Record này đóng audit: khoá hướng
cho #7-#10, sửa `id-systems-audit.md` khỏi các chỗ đã trôi khỏi thực tế
shipped (draft viết trước khi STR53-STR58 thi công), và trả lời câu hỏi CoS
gốc của STR47 — giữ đa hệ có chủ đích hay hợp nhất.
```

### Full target shown text

```text
Cả sáu đều mang trạng thái `done` trong `docs/backlog.md`. Nhóm bee (#7-#10)
— D-hex/D-local shape collision, cell-id, feature slug — chưa từng được bàn
tới điểm chốt trong bản DRAFT 2026-07-18. Record này đóng audit: khoá hướng
cho #7-#10, sửa `id-systems-audit.md` khỏi các chỗ đã trôi khỏi thực tế
shipped (draft viết trước khi STR53-STR58 thi công), và trả lời câu hỏi CoS
gốc của STR47 — giữ đa hệ có chủ đích hay hợp nhất.
```

### Unified diff

```diff
No text difference.
```

## claim_28a7014f4b61295d24a6b2c06c8d65e4

Source: `docs/architecture-map.md#quyết-định-2`. Target: `docs/platform/architecture-map.md#quyết-định-2`.

Mechanical class: Judgment. Source digest: `1863e837052e9e51ff7880acdc2dee031b288f8367f2cbb60633ebd6e0aa0603`. Target digest: `78d1d4acb343aec78f72cb0056c792386cb7c5f262a86286dbce03167699e612`.

Full shown source SHA256: `7af35de8c0d15e41eb80b913850783c327821d596c3d25b9db3b752aa256992d`. Full shown target SHA256: `b034cef74acd225a0221f45bd7e4b1e4dcea946e8a5d4cf3819e164929a9bf77`.

### Proposed decision

```json
{
  "claimId": "claim_28a7014f4b61295d24a6b2c06c8d65e4",
  "sourceUnitDigest": "1863e837052e9e51ff7880acdc2dee031b288f8367f2cbb60633ebd6e0aa0603",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "quyết-định-2",
  "targetUnitDigest": "78d1d4acb343aec78f72cb0056c792386cb7c5f262a86286dbce03167699e612",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0017 — Đóng audit hệ id/tên gọi (STR47)"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architecture-map.md#quyết-định-2 (lines 710–710) into docs/platform/architecture-map.md#quyết-định-2 (lines 787–787), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
#### Quyết định

1. **Giữ đa hệ có chủ đích — không hợp nhất.** Sáu hệ fgOS (#1-#6) và bảy hệ
   bee (#7-#13) tiếp tục sống song song, mỗi hệ phục vụ đúng một tầng: fgOS
   là sản phẩm vĩnh viễn (tự sinh/tự đọc không phụ thuộc bee), bee là giàn
   giáo tạm cho giai đoạn xây fgOS (khung: `0004-pham-vi-va-non-goal.md`).
   Ranh giới dùng-khi-nào của cả 13 hệ được tài liệu hoá tại
   `docs/id-systems-audit.md` (nguồn) và `docs/architecture-map.md` Phụ lục B
   (bản tóm tắt, §12 trỏ vào).
2. **#7/#8 (D-hex global vs `D<n>` local) — không rename, khoá luật citation.**
   Thay vì đổi D-local thành `L<n>` hay bỏ hẳn bảng cục bộ, luật được khoá:
   **D-local không bao giờ được trích dẫn ngoài file `CONTEXT.md` gốc của
   nó.** D-local vốn đã single-file trong thực tế — rủi ro thật chỉ là kỷ
   luật trích dẫn, không phải hình dạng chữ `D` dùng chung; luật này đóng
   đúng rủi ro đó với chi phí migrate bằng 0.
3. **#9 (cell-id) và #10 (feature slug) — giữ nguyên, không format mới.**
   Cả hai convention-scoped (không phải enforced bằng regex chặt): cell-id
   (`.bee/bin/lib/cells.mjs` `ID_PATTERN`) chỉ có nguy cơ trùng trong PHẠM VI
   một feature và chưa từng va chạm thật; feature slug có tính duy nhất nhờ
   hiệu ứng phụ của cửa tạo worktree (`bee worktree new` từ chối branch/dir
   đã tồn tại), không phải nhờ định dạng id. Theo khung "giàn giáo tạm", cả
   hai không đáng đầu tư thêm.
4. **Phụ lục boundary cuối cùng đặt tại `docs/architecture-map.md`** (Phụ lục
   B mới, §12 thêm một dòng trỏ vào), không phải `docs/specs/reading-map.md`.
   `architecture-map.md` đã là nhà của sổ đăng ký anh em (contract registry
   §7, đổi tên bởi decision `0015`) — cùng một họ tài liệu. `reading-map.md`
   là bản đồ locator thuần cho toàn bộ tài liệu khác trong repo (không có
   mục `##` nào, mỗi dòng một bullet trỏ ra ngoài) — giữ nguyên vai trò đó,
   chỉ sửa một dòng mô tả đã trôi (§ dưới).
5. **`id-systems-audit.md` được cập nhật khỏi trạng thái DRAFT sang FINAL**,
   sửa mọi chỗ đã trôi khỏi thực tế shipped: §1 dòng #1 (định dạng đúng là
   `tsk-<hash>`, chữ thường + gạch nối — không phải `TSK<hash>` như draft đề
   xuất ban đầu), §4 (6 dòng migrate đổi từ "chốt hướng/chưa migrate" sang
   "đã migrate" kèm PBI đóng), câu "Chưa áp dụng gì vào code/docs thật" (sai
   sau khi STR53-STR58 chạy xong), và frontmatter (`status: DRAFT` →
   `FINAL`). `docs/specs/reading-map.md`'s mô tả `classify.mjs` (`generateId
   (slug+hash chống trùng)`) cũng sửa theo cùng lý do — cùng gốc trôi thời
   gian (draft viết 2026-07-18, trước khi migration chạy).
```

### Full target shown text

```text
###### Quyết định

1. **Giữ đa hệ có chủ đích — không hợp nhất.** Sáu hệ fgOS (#1-#6) và bảy hệ
   bee (#7-#13) tiếp tục sống song song, mỗi hệ phục vụ đúng một tầng: fgOS
   là sản phẩm vĩnh viễn (tự sinh/tự đọc không phụ thuộc bee), bee là giàn
   giáo tạm cho giai đoạn xây fgOS (khung: `0004-pham-vi-va-non-goal.md`).
   Ranh giới dùng-khi-nào của cả 13 hệ được tài liệu hoá tại
   `docs/id-systems-audit.md` (nguồn) và `docs/architecture-map.md` Phụ lục B
   (bản tóm tắt, §12 trỏ vào).
2. **#7/#8 (D-hex global vs `D<n>` local) — không rename, khoá luật citation.**
   Thay vì đổi D-local thành `L<n>` hay bỏ hẳn bảng cục bộ, luật được khoá:
   **D-local không bao giờ được trích dẫn ngoài file `CONTEXT.md` gốc của
   nó.** D-local vốn đã single-file trong thực tế — rủi ro thật chỉ là kỷ
   luật trích dẫn, không phải hình dạng chữ `D` dùng chung; luật này đóng
   đúng rủi ro đó với chi phí migrate bằng 0.
3. **#9 (cell-id) và #10 (feature slug) — giữ nguyên, không format mới.**
   Cả hai convention-scoped (không phải enforced bằng regex chặt): cell-id
   (`.bee/bin/lib/cells.mjs` `ID_PATTERN`) chỉ có nguy cơ trùng trong PHẠM VI
   một feature và chưa từng va chạm thật; feature slug có tính duy nhất nhờ
   hiệu ứng phụ của cửa tạo worktree (`bee worktree new` từ chối branch/dir
   đã tồn tại), không phải nhờ định dạng id. Theo khung "giàn giáo tạm", cả
   hai không đáng đầu tư thêm.
4. **Phụ lục boundary cuối cùng đặt tại `docs/architecture-map.md`** (Phụ lục
   B mới, §12 thêm một dòng trỏ vào), không phải `docs/specs/reading-map.md`.
   `architecture-map.md` đã là nhà của sổ đăng ký anh em (contract registry
   §7, đổi tên bởi decision `0015`) — cùng một họ tài liệu. `reading-map.md`
   là bản đồ locator thuần cho toàn bộ tài liệu khác trong repo (không có
   mục `##` nào, mỗi dòng một bullet trỏ ra ngoài) — giữ nguyên vai trò đó,
   chỉ sửa một dòng mô tả đã trôi (§ dưới).
5. **`id-systems-audit.md` được cập nhật khỏi trạng thái DRAFT sang FINAL**,
   sửa mọi chỗ đã trôi khỏi thực tế shipped: §1 dòng #1 (định dạng đúng là
   `tsk-<hash>`, chữ thường + gạch nối — không phải `TSK<hash>` như draft đề
   xuất ban đầu), §4 (6 dòng migrate đổi từ "chốt hướng/chưa migrate" sang
   "đã migrate" kèm PBI đóng), câu "Chưa áp dụng gì vào code/docs thật" (sai
   sau khi STR53-STR58 chạy xong), và frontmatter (`status: DRAFT` →
   `FINAL`). `docs/specs/reading-map.md`'s mô tả `classify.mjs` (`generateId
   (slug+hash chống trùng)`) cũng sửa theo cùng lý do — cùng gốc trôi thời
   gian (draft viết 2026-07-18, trước khi migration chạy).
```

### Unified diff

```diff
--- docs/architecture-map.md#quyết-định-2
+++ docs/platform/architecture-map.md#quyết-định-2
@@ -1,4 +1,4 @@
-#### Quyết định
+###### Quyết định
 
 1. **Giữ đa hệ có chủ đích — không hợp nhất.** Sáu hệ fgOS (#1-#6) và bảy hệ
    bee (#7-#13) tiếp tục sống song song, mỗi hệ phục vụ đúng một tầng: fgOS

```

## claim_f8c57b95150de6d340321be7cda76e69

Source: `docs/architecture-map.md#unheaded-block-81`. Target: `docs/platform/architecture-map.md#unheaded-block-95`.

Mechanical class: Weak-exact. Source digest: `10bd320d3ebf3c6aa9fb7722994244eb37c4a0e358ee99317bbb0259b62c8f5d`. Target digest: `10bd320d3ebf3c6aa9fb7722994244eb37c4a0e358ee99317bbb0259b62c8f5d`.

Full shown source SHA256: `10bd320d3ebf3c6aa9fb7722994244eb37c4a0e358ee99317bbb0259b62c8f5d`. Full shown target SHA256: `10bd320d3ebf3c6aa9fb7722994244eb37c4a0e358ee99317bbb0259b62c8f5d`.

### Proposed decision

```json
{
  "claimId": "claim_f8c57b95150de6d340321be7cda76e69",
  "sourceUnitDigest": "10bd320d3ebf3c6aa9fb7722994244eb37c4a0e358ee99317bbb0259b62c8f5d",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "unheaded-block-95",
  "targetUnitDigest": "10bd320d3ebf3c6aa9fb7722994244eb37c4a0e358ee99317bbb0259b62c8f5d",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0017 — Đóng audit hệ id/tên gọi (STR47)",
    "Quyết định"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-81 (lines 712–747) into docs/platform/architecture-map.md#unheaded-block-95 (lines 789–824), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
1. **Giữ đa hệ có chủ đích — không hợp nhất.** Sáu hệ fgOS (#1-#6) và bảy hệ
   bee (#7-#13) tiếp tục sống song song, mỗi hệ phục vụ đúng một tầng: fgOS
   là sản phẩm vĩnh viễn (tự sinh/tự đọc không phụ thuộc bee), bee là giàn
   giáo tạm cho giai đoạn xây fgOS (khung: `0004-pham-vi-va-non-goal.md`).
   Ranh giới dùng-khi-nào của cả 13 hệ được tài liệu hoá tại
   `docs/id-systems-audit.md` (nguồn) và `docs/architecture-map.md` Phụ lục B
   (bản tóm tắt, §12 trỏ vào).
2. **#7/#8 (D-hex global vs `D<n>` local) — không rename, khoá luật citation.**
   Thay vì đổi D-local thành `L<n>` hay bỏ hẳn bảng cục bộ, luật được khoá:
   **D-local không bao giờ được trích dẫn ngoài file `CONTEXT.md` gốc của
   nó.** D-local vốn đã single-file trong thực tế — rủi ro thật chỉ là kỷ
   luật trích dẫn, không phải hình dạng chữ `D` dùng chung; luật này đóng
   đúng rủi ro đó với chi phí migrate bằng 0.
3. **#9 (cell-id) và #10 (feature slug) — giữ nguyên, không format mới.**
   Cả hai convention-scoped (không phải enforced bằng regex chặt): cell-id
   (`.bee/bin/lib/cells.mjs` `ID_PATTERN`) chỉ có nguy cơ trùng trong PHẠM VI
   một feature và chưa từng va chạm thật; feature slug có tính duy nhất nhờ
   hiệu ứng phụ của cửa tạo worktree (`bee worktree new` từ chối branch/dir
   đã tồn tại), không phải nhờ định dạng id. Theo khung "giàn giáo tạm", cả
   hai không đáng đầu tư thêm.
4. **Phụ lục boundary cuối cùng đặt tại `docs/architecture-map.md`** (Phụ lục
   B mới, §12 thêm một dòng trỏ vào), không phải `docs/specs/reading-map.md`.
   `architecture-map.md` đã là nhà của sổ đăng ký anh em (contract registry
   §7, đổi tên bởi decision `0015`) — cùng một họ tài liệu. `reading-map.md`
   là bản đồ locator thuần cho toàn bộ tài liệu khác trong repo (không có
   mục `##` nào, mỗi dòng một bullet trỏ ra ngoài) — giữ nguyên vai trò đó,
   chỉ sửa một dòng mô tả đã trôi (§ dưới).
5. **`id-systems-audit.md` được cập nhật khỏi trạng thái DRAFT sang FINAL**,
   sửa mọi chỗ đã trôi khỏi thực tế shipped: §1 dòng #1 (định dạng đúng là
   `tsk-<hash>`, chữ thường + gạch nối — không phải `TSK<hash>` như draft đề
   xuất ban đầu), §4 (6 dòng migrate đổi từ "chốt hướng/chưa migrate" sang
   "đã migrate" kèm PBI đóng), câu "Chưa áp dụng gì vào code/docs thật" (sai
   sau khi STR53-STR58 chạy xong), và frontmatter (`status: DRAFT` →
   `FINAL`). `docs/specs/reading-map.md`'s mô tả `classify.mjs` (`generateId
   (slug+hash chống trùng)`) cũng sửa theo cùng lý do — cùng gốc trôi thời
   gian (draft viết 2026-07-18, trước khi migration chạy).
```

### Full target shown text

```text
1. **Giữ đa hệ có chủ đích — không hợp nhất.** Sáu hệ fgOS (#1-#6) và bảy hệ
   bee (#7-#13) tiếp tục sống song song, mỗi hệ phục vụ đúng một tầng: fgOS
   là sản phẩm vĩnh viễn (tự sinh/tự đọc không phụ thuộc bee), bee là giàn
   giáo tạm cho giai đoạn xây fgOS (khung: `0004-pham-vi-va-non-goal.md`).
   Ranh giới dùng-khi-nào của cả 13 hệ được tài liệu hoá tại
   `docs/id-systems-audit.md` (nguồn) và `docs/architecture-map.md` Phụ lục B
   (bản tóm tắt, §12 trỏ vào).
2. **#7/#8 (D-hex global vs `D<n>` local) — không rename, khoá luật citation.**
   Thay vì đổi D-local thành `L<n>` hay bỏ hẳn bảng cục bộ, luật được khoá:
   **D-local không bao giờ được trích dẫn ngoài file `CONTEXT.md` gốc của
   nó.** D-local vốn đã single-file trong thực tế — rủi ro thật chỉ là kỷ
   luật trích dẫn, không phải hình dạng chữ `D` dùng chung; luật này đóng
   đúng rủi ro đó với chi phí migrate bằng 0.
3. **#9 (cell-id) và #10 (feature slug) — giữ nguyên, không format mới.**
   Cả hai convention-scoped (không phải enforced bằng regex chặt): cell-id
   (`.bee/bin/lib/cells.mjs` `ID_PATTERN`) chỉ có nguy cơ trùng trong PHẠM VI
   một feature và chưa từng va chạm thật; feature slug có tính duy nhất nhờ
   hiệu ứng phụ của cửa tạo worktree (`bee worktree new` từ chối branch/dir
   đã tồn tại), không phải nhờ định dạng id. Theo khung "giàn giáo tạm", cả
   hai không đáng đầu tư thêm.
4. **Phụ lục boundary cuối cùng đặt tại `docs/architecture-map.md`** (Phụ lục
   B mới, §12 thêm một dòng trỏ vào), không phải `docs/specs/reading-map.md`.
   `architecture-map.md` đã là nhà của sổ đăng ký anh em (contract registry
   §7, đổi tên bởi decision `0015`) — cùng một họ tài liệu. `reading-map.md`
   là bản đồ locator thuần cho toàn bộ tài liệu khác trong repo (không có
   mục `##` nào, mỗi dòng một bullet trỏ ra ngoài) — giữ nguyên vai trò đó,
   chỉ sửa một dòng mô tả đã trôi (§ dưới).
5. **`id-systems-audit.md` được cập nhật khỏi trạng thái DRAFT sang FINAL**,
   sửa mọi chỗ đã trôi khỏi thực tế shipped: §1 dòng #1 (định dạng đúng là
   `tsk-<hash>`, chữ thường + gạch nối — không phải `TSK<hash>` như draft đề
   xuất ban đầu), §4 (6 dòng migrate đổi từ "chốt hướng/chưa migrate" sang
   "đã migrate" kèm PBI đóng), câu "Chưa áp dụng gì vào code/docs thật" (sai
   sau khi STR53-STR58 chạy xong), và frontmatter (`status: DRAFT` →
   `FINAL`). `docs/specs/reading-map.md`'s mô tả `classify.mjs` (`generateId
   (slug+hash chống trùng)`) cũng sửa theo cùng lý do — cùng gốc trôi thời
   gian (draft viết 2026-07-18, trước khi migration chạy).
```

### Unified diff

```diff
No text difference.
```

## claim_0b812df6a0a21a8677eba1af4d33079f

Source: `docs/architecture-map.md#hệ-quả-2`. Target: `docs/platform/architecture-map.md#hệ-quả-2`.

Mechanical class: Judgment. Source digest: `7003ddae36612619e2e27e1aaa1439e9c021eccd4f636cb17100c3cbcd617fb9`. Target digest: `d99967f99607f0c6b8df3862099e628c2486fbe884e0a7ae996280421bf27cc0`.

Full shown source SHA256: `23f3dc0063f8c7743b1b59dd5d29aecdf9739c794cdc3cbc27a79f4b55430bf1`. Full shown target SHA256: `02f7d8c8a608d455b578afc412e60c24b1f999263e8042e331bc3dfefd61c495`.

### Proposed decision

```json
{
  "claimId": "claim_0b812df6a0a21a8677eba1af4d33079f",
  "sourceUnitDigest": "7003ddae36612619e2e27e1aaa1439e9c021eccd4f636cb17100c3cbcd617fb9",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "hệ-quả-2",
  "targetUnitDigest": "d99967f99607f0c6b8df3862099e628c2486fbe884e0a7ae996280421bf27cc0",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0017 — Đóng audit hệ id/tên gọi (STR47)"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architecture-map.md#hệ-quả-2 (lines 749–749) into docs/platform/architecture-map.md#hệ-quả-2 (lines 826–826), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
#### Hệ quả

- **STR47 đóng** (`docs/backlog.md`: `in-flight` → `done`) — không có
  migration mới nào mở ra từ record này; mọi migration mà audit từng đề
  xuất (#1, #3, #4, #5, #6) đã thi công xong trước record này qua
  STR53-STR58.
- **Không đổi schema, không đổi code.** Đây là record đóng-audit + sửa tài
  liệu trôi thời gian; không hệ id nào đổi hành vi runtime bởi chính record
  này (các hệ #1/#3/#4/#5/#6 đã đổi hành vi từ trước, qua các PBI riêng của
  chúng — record này chỉ cập nhật tài liệu cho khớp).
- **0004 và 0015 không bị supersede** — 0017 chỉ đóng vòng lặp mà 0004 mở ra
  (khung giữ-đa-hệ) và xác nhận 0015 (CTR rename) là một trong sáu migration
  đã hoàn tất, không đổi nội dung của cả hai.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target shown text

```text
###### Hệ quả

- **STR47 đóng** (`docs/backlog.md`: `in-flight` → `done`) — không có
  migration mới nào mở ra từ record này; mọi migration mà audit từng đề
  xuất (#1, #3, #4, #5, #6) đã thi công xong trước record này qua
  STR53-STR58.
- **Không đổi schema, không đổi code.** Đây là record đóng-audit + sửa tài
  liệu trôi thời gian; không hệ id nào đổi hành vi runtime bởi chính record
  này (các hệ #1/#3/#4/#5/#6 đã đổi hành vi từ trước, qua các PBI riêng của
  chúng — record này chỉ cập nhật tài liệu cho khớp).
- **0004 và 0015 không bị supersede** — 0017 chỉ đóng vòng lặp mà 0004 mở ra
  (khung giữ-đa-hệ) và xác nhận 0015 (CTR rename) là một trong sáu migration
  đã hoàn tất, không đổi nội dung của cả hai.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Unified diff

```diff
--- docs/architecture-map.md#hệ-quả-2
+++ docs/platform/architecture-map.md#hệ-quả-2
@@ -1,4 +1,4 @@
-#### Hệ quả
+###### Hệ quả
 
 - **STR47 đóng** (`docs/backlog.md`: `in-flight` → `done`) — không có
   migration mới nào mở ra từ record này; mọi migration mà audit từng đề

```

## claim_301dc3d547781a9a12b9c1a78fa7c6e7

Source: `docs/architecture-map.md#unheaded-block-82`. Target: `docs/platform/architecture-map.md#unheaded-block-96`.

Mechanical class: Weak-exact. Source digest: `0eae1136d99e795f748a0200fb2afe1813319fbdc4e1fe5df44c1d2958005d49`. Target digest: `0eae1136d99e795f748a0200fb2afe1813319fbdc4e1fe5df44c1d2958005d49`.

Full shown source SHA256: `0eae1136d99e795f748a0200fb2afe1813319fbdc4e1fe5df44c1d2958005d49`. Full shown target SHA256: `0eae1136d99e795f748a0200fb2afe1813319fbdc4e1fe5df44c1d2958005d49`.

### Proposed decision

```json
{
  "claimId": "claim_301dc3d547781a9a12b9c1a78fa7c6e7",
  "sourceUnitDigest": "0eae1136d99e795f748a0200fb2afe1813319fbdc4e1fe5df44c1d2958005d49",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "unheaded-block-96",
  "targetUnitDigest": "0eae1136d99e795f748a0200fb2afe1813319fbdc4e1fe5df44c1d2958005d49",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0017 — Đóng audit hệ id/tên gọi (STR47)",
    "Hệ quả"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-82 (lines 751–761) into docs/platform/architecture-map.md#unheaded-block-96 (lines 828–838), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- **STR47 đóng** (`docs/backlog.md`: `in-flight` → `done`) — không có
  migration mới nào mở ra từ record này; mọi migration mà audit từng đề
  xuất (#1, #3, #4, #5, #6) đã thi công xong trước record này qua
  STR53-STR58.
- **Không đổi schema, không đổi code.** Đây là record đóng-audit + sửa tài
  liệu trôi thời gian; không hệ id nào đổi hành vi runtime bởi chính record
  này (các hệ #1/#3/#4/#5/#6 đã đổi hành vi từ trước, qua các PBI riêng của
  chúng — record này chỉ cập nhật tài liệu cho khớp).
- **0004 và 0015 không bị supersede** — 0017 chỉ đóng vòng lặp mà 0004 mở ra
  (khung giữ-đa-hệ) và xác nhận 0015 (CTR rename) là một trong sáu migration
  đã hoàn tất, không đổi nội dung của cả hai.
```

### Full target shown text

```text
- **STR47 đóng** (`docs/backlog.md`: `in-flight` → `done`) — không có
  migration mới nào mở ra từ record này; mọi migration mà audit từng đề
  xuất (#1, #3, #4, #5, #6) đã thi công xong trước record này qua
  STR53-STR58.
- **Không đổi schema, không đổi code.** Đây là record đóng-audit + sửa tài
  liệu trôi thời gian; không hệ id nào đổi hành vi runtime bởi chính record
  này (các hệ #1/#3/#4/#5/#6 đã đổi hành vi từ trước, qua các PBI riêng của
  chúng — record này chỉ cập nhật tài liệu cho khớp).
- **0004 và 0015 không bị supersede** — 0017 chỉ đóng vòng lặp mà 0004 mở ra
  (khung giữ-đa-hệ) và xác nhận 0015 (CTR rename) là một trong sáu migration
  đã hoàn tất, không đổi nội dung của cả hai.
```

### Unified diff

```diff
No text difference.
```

## claim_15a3179944bc76f990fe1b965e40a9da

Source: `docs/architecture-map.md#unheaded-block-83`. Target: `docs/platform/architecture-map.md#unheaded-block-97`.

Mechanical class: Judgment. Source digest: `95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104`. Target digest: `95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104`.

Full shown source SHA256: `95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104`. Full shown target SHA256: `95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104`.

### Proposed decision

```json
{
  "claimId": "claim_15a3179944bc76f990fe1b965e40a9da",
  "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
  "targetOwner": "docs/platform/architecture-map.md",
  "targetAnchor": "unheaded-block-97",
  "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
  "targetAncestry": [
    "Architecture Map",
    "Added in candidate: architecture-map source carriage",
    "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0017 — Đóng audit hệ id/tên gọi (STR47)",
    "Hệ quả"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: digest match points to another occurrence; use the source occurrence line-mapped carrier. Carry the complete unheaded-block at docs/architecture-map.md#unheaded-block-83 (lines 763–763) into docs/platform/architecture-map.md#unheaded-block-97 (lines 840–840), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target shown text

```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Unified diff

```diff
No text difference.
```
