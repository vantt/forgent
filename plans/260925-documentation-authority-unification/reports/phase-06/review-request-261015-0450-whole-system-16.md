# Bounded whole-system source review request

Content commit: `a8a10abc1a24218518a14764f68c8d86f4810f91`. Author session: `codex-session:37@2026-10-15`. Review mode requested: ordinary.

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s6-whole-system-system-overview.json`. Part 1/1; entries: **50**. Sidecar: `review-request-261015-0450-whole-system-16.md.json`.

Read review-brief.md, owner-answers.md A28–A37, frozen whole-system map, constitution, vocabulary and shard schema. Apply A36: mechanically check every row (full digest recompute, anchor check, shard/pack equality); deeply read the reviewer-seeded sample plus every differing-digest row in both directions with its diff. Preserve conditions, qualifiers, dated status and complete payload; verify one owner and labelled additions. No approval is supplied here.

Step 6’s closing review is a **checkpoint review whose sensitivity pack the reviewer holds**. The author has not created, seen or selected that pack/key. Ordinary review and A36 sampling do not replace checkpoint sensitivity.

Ordinary verdict contract: `Reviewer: <independent identity>`, `Review mode: ordinary`, request/content/shard pins; one own note and full 64-hex shown-unit digests per row. Use ok/rework/hold. Consolidate parts into a complete report for the original shard before unchanged ordinary application; never edit decisions manually.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

A36 mandatory differing-digest rows (2): `claim_1599c9be961fd950fd31f7968df151f0`, `claim_5ddd03659de1b4ef2a2c2b478a1510df`.

Absent-target rows (0): none.

This pack has 19 Weak-exact/Judgment rows; reviewer independently draws/records at least 10 by seed (>=15%, minimum 10, all if fewer), plus every differing pair listed above. Each verdict note says deep or mechanical. If >3% of deep-read rows need rework, deeply read the complete pack before reporting. Author selected no sample. Whole batch: 300 Unit-exact, 392 Weak-exact, 134 Judgment, all 826 pending; 123 mandatory differing pairs. The 79-row batch-wide lower bound does not replace each pack minimum.

Reverse review: the separate native candidate-unverified request/list covers the complete scoped population; it is not reset per sliced pack. Full shown text hashes below bind payload separately from native heading identity digests.

## claim_1599c9be961fd950fd31f7968df151f0

Source: `docs/specs/system-overview.md#unheaded-block-1`. Target: `docs/platform/system-overview/spec.md#unheaded-block-4`.

Mechanical class: Judgment. Source digest: `9e1a9d1f3ca3d9f34e677bb6ef70f417c1541d145690a2cfb8d110099b82ab3c`. Target digest: `92c6136983a61b3c11639f79066d53e3cf42909f9361da99a0d3884039d2324e`.

Full shown source SHA256: `9e1a9d1f3ca3d9f34e677bb6ef70f417c1541d145690a2cfb8d110099b82ab3c`. Full shown target SHA256: `92c6136983a61b3c11639f79066d53e3cf42909f9361da99a0d3884039d2324e`.

### Proposed decision

```json
{
  "claimId": "claim_1599c9be961fd950fd31f7968df151f0",
  "sourceUnitDigest": "9e1a9d1f3ca3d9f34e677bb6ef70f417c1541d145690a2cfb8d110099b82ab3c",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "92c6136983a61b3c11639f79066d53e3cf42909f9361da99a0d3884039d2324e",
  "targetAncestry": [
    "Spec: System Overview"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete unheaded-preamble at docs/specs/system-overview.md#unheaded-block-1 (lines 1–6) into docs/platform/system-overview/spec.md#unheaded-block-4 (lines 27–34), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
---
area: system-overview
updated: 2026-08-12
decisions: [ca7de3cf, ae461c8b, ed953e09, 14ebeea9, 1a80b4d3, 65c642a8, 43f257ae, 6f2cbc47, a30a3d3c, 1359ab5e, b2d18cc7, 1d336d8a, 02623bff, c74bcef9]
coverage: partial
---
```

### Full target shown text

````text
```yaml
---
area: system-overview
updated: 2026-08-12
decisions: [ca7de3cf, ae461c8b, ed953e09, 14ebeea9, 1a80b4d3, 65c642a8, 43f257ae, 6f2cbc47, a30a3d3c, 1359ab5e, b2d18cc7, 1d336d8a, 02623bff, c74bcef9]
coverage: partial
---
```
````

### Unified diff

````diff
--- docs/specs/system-overview.md#unheaded-block-1
+++ docs/platform/system-overview/spec.md#unheaded-block-4
@@ -1,6 +1,8 @@
+```yaml
 ---
 area: system-overview
 updated: 2026-08-12
 decisions: [ca7de3cf, ae461c8b, ed953e09, 14ebeea9, 1a80b4d3, 65c642a8, 43f257ae, 6f2cbc47, a30a3d3c, 1359ab5e, b2d18cc7, 1d336d8a, 02623bff, c74bcef9]
 coverage: partial
 ---
+```

````

## claim_5ddd03659de1b4ef2a2c2b478a1510df

Source: `docs/specs/system-overview.md#spec-system-overview`. Target: `docs/platform/system-overview/spec.md#spec-system-overview`.

Mechanical class: Judgment. Source digest: `bc451967bf59effc9c6171920099b452baa0768a6ce429845e4498c8204ae0d8`. Target digest: `d10a4d2fd4f4d967d9bd0b89f57dfeaaff0da2161890b0dfd1660f9761b14f76`.

Full shown source SHA256: `eb2db11aad0719c1e61f7932300f752481aad743c7b795153c7dabac2c36dd59`. Full shown target SHA256: `44cac1c8e224c90124b21b6e06cee6bed91545864c26baab054cb3f63744a3eb`.

### Proposed decision

```json
{
  "claimId": "claim_5ddd03659de1b4ef2a2c2b478a1510df",
  "sourceUnitDigest": "bc451967bf59effc9c6171920099b452baa0768a6ce429845e4498c8204ae0d8",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "spec-system-overview",
  "targetUnitDigest": "d10a4d2fd4f4d967d9bd0b89f57dfeaaff0da2161890b0dfd1660f9761b14f76",
  "targetAncestry": [],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/specs/system-overview.md#spec-system-overview (lines 8–8) into docs/platform/system-overview/spec.md#spec-system-overview (lines 1–1), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
# Spec: System Overview

> "Forgent (fgOS) is the platform layer for building and running agent applications — the infrastructure, skills, and automation that sit beneath every agent app, so developers can forge new agents instead of building everything from scratch." (README, đoạn mở đầu, verbatim)
```

### Full target shown text

````text
# Spec: System Overview

```txt
Document type: Area spec
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve the complete system-overview.md source at its frozen-map candidate owner
Design status: Candidate
Implementation: Partial — inherited source qualifications; not independently truth-verified
Provenance: docs/specs/system-overview.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 (blob c24c5561dc60cce7e53d0a0c5e34ff97414845ac)
Writer type: Agent carriage; independent review pending
Canonical for: Nothing until promotion; current source remains docs/specs/system-overview.md
Use this when: Reviewing whole-system candidate carriage and placement
Do not use this for: Inferring implementation, promotion or superseding source authority
Last reviewed: Pending independent review
Related:
- docs/specs/system-overview.md
- docs/platform/component-boundary.md
- docs/platform/architecture-map.md
Supersedes: None — candidate only
Superseded by: None
```

Added in candidate: migration metadata and physical link rebasing. Original source metadata, dates, design limits and historic claims below are provenance, not fresh review. Current truth is unverified; A28 requires sampled truth review at this checkpoint and full truth review at promotion.

Added in candidate: original source frontmatter (verbatim provenance).

```yaml
---
area: system-overview
updated: 2026-08-12
decisions: [ca7de3cf, ae461c8b, ed953e09, 14ebeea9, 1a80b4d3, 65c642a8, 43f257ae, 6f2cbc47, a30a3d3c, 1359ab5e, b2d18cc7, 1d336d8a, 02623bff, c74bcef9]
coverage: partial
---
```



> "Forgent (fgOS) is the platform layer for building and running agent applications — the infrastructure, skills, and automation that sit beneath every agent app, so developers can forge new agents instead of building everything from scratch." (README, đoạn mở đầu, verbatim)
````

### Unified diff

````diff
--- docs/specs/system-overview.md#spec-system-overview
+++ docs/platform/system-overview/spec.md#spec-system-overview
@@ -1,3 +1,38 @@
 # Spec: System Overview
 
+```txt
+Document type: Area spec
+Audience: Human reviewer, architect, maintainer, agent
+Purpose: Preserve the complete system-overview.md source at its frozen-map candidate owner
+Design status: Candidate
+Implementation: Partial — inherited source qualifications; not independently truth-verified
+Provenance: docs/specs/system-overview.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 (blob c24c5561dc60cce7e53d0a0c5e34ff97414845ac)
+Writer type: Agent carriage; independent review pending
+Canonical for: Nothing until promotion; current source remains docs/specs/system-overview.md
+Use this when: Reviewing whole-system candidate carriage and placement
+Do not use this for: Inferring implementation, promotion or superseding source authority
+Last reviewed: Pending independent review
+Related:
+- docs/specs/system-overview.md
+- docs/platform/component-boundary.md
+- docs/platform/architecture-map.md
+Supersedes: None — candidate only
+Superseded by: None
+```
+
+Added in candidate: migration metadata and physical link rebasing. Original source metadata, dates, design limits and historic claims below are provenance, not fresh review. Current truth is unverified; A28 requires sampled truth review at this checkpoint and full truth review at promotion.
+
+Added in candidate: original source frontmatter (verbatim provenance).
+
+```yaml
+---
+area: system-overview
+updated: 2026-08-12
+decisions: [ca7de3cf, ae461c8b, ed953e09, 14ebeea9, 1a80b4d3, 65c642a8, 43f257ae, 6f2cbc47, a30a3d3c, 1359ab5e, b2d18cc7, 1d336d8a, 02623bff, c74bcef9]
+coverage: partial
+---
+```
+
+
+
 > "Forgent (fgOS) is the platform layer for building and running agent applications — the infrastructure, skills, and automation that sit beneath every agent app, so developers can forge new agents instead of building everything from scratch." (README, đoạn mở đầu, verbatim)

````

## claim_4e2ced15313eb1f0dfbbb55af597da19

Source: `docs/specs/system-overview.md#unheaded-block-2`. Target: `docs/platform/system-overview/spec.md#unheaded-block-5`.

Mechanical class: Unit-exact. Source digest: `9aa28977c76de97b94fbd4ad135af648382d8adefb782e56ae24055aa8db8aae`. Target digest: `9aa28977c76de97b94fbd4ad135af648382d8adefb782e56ae24055aa8db8aae`.

Full shown source SHA256: `9aa28977c76de97b94fbd4ad135af648382d8adefb782e56ae24055aa8db8aae`. Full shown target SHA256: `9aa28977c76de97b94fbd4ad135af648382d8adefb782e56ae24055aa8db8aae`.

### Proposed decision

```json
{
  "claimId": "claim_4e2ced15313eb1f0dfbbb55af597da19",
  "sourceUnitDigest": "9aa28977c76de97b94fbd4ad135af648382d8adefb782e56ae24055aa8db8aae",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "9aa28977c76de97b94fbd4ad135af648382d8adefb782e56ae24055aa8db8aae",
  "targetAncestry": [
    "Spec: System Overview"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-2 (lines 10–10) into docs/platform/system-overview/spec.md#unheaded-block-5 (lines 38–38), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
> "Forgent (fgOS) is the platform layer for building and running agent applications — the infrastructure, skills, and automation that sit beneath every agent app, so developers can forge new agents instead of building everything from scratch." (README, đoạn mở đầu, verbatim)
```

### Full target shown text

```text
> "Forgent (fgOS) is the platform layer for building and running agent applications — the infrastructure, skills, and automation that sit beneath every agent app, so developers can forge new agents instead of building everything from scratch." (README, đoạn mở đầu, verbatim)
```

### Unified diff

```diff
No text difference.
```

## claim_3f292fa3beda7ba097f734f4c1dc1860

Source: `docs/specs/system-overview.md#area-map`. Target: `docs/platform/system-overview/spec.md#area-map`.

Mechanical class: Weak-exact. Source digest: `dd205504b1bbbd1f53c7318ea35cc472a0d1cdbae5c9bb942547ab263e8e2c69`. Target digest: `dd205504b1bbbd1f53c7318ea35cc472a0d1cdbae5c9bb942547ab263e8e2c69`.

Full shown source SHA256: `b9238579d8e9c569d84859cc848e906bc17e4d31ae958623d08a262c796b406f`. Full shown target SHA256: `b9238579d8e9c569d84859cc848e906bc17e4d31ae958623d08a262c796b406f`.

### Proposed decision

```json
{
  "claimId": "claim_3f292fa3beda7ba097f734f4c1dc1860",
  "sourceUnitDigest": "dd205504b1bbbd1f53c7318ea35cc472a0d1cdbae5c9bb942547ab263e8e2c69",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "area-map",
  "targetUnitDigest": "dd205504b1bbbd1f53c7318ea35cc472a0d1cdbae5c9bb942547ab263e8e2c69",
  "targetAncestry": [
    "Spec: System Overview"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/specs/system-overview.md#area-map (lines 12–12) into docs/platform/system-overview/spec.md#area-map (lines 40–40), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## Area Map

- platform-foundations — 8 luật thiết kế đã khóa đứng trên mọi code của compound stack; spec: platform-foundations.md
- work-state — bộ nhớ công việc tự quản của forgent (cửa lệnh `fgos`, nhật ký sự kiện là truth, bản chiếu dựng lại được); spec: work-state.md
- enduser-docs-authoring — soạn & nuôi tài liệu người-dùng-cuối ở khâu tổng-hợp, tức khi việc mang status `retrospective`: biến capture thật thành tài liệu theo ngăn Diataxis, một tài liệu sống trên mỗi đường dẫn, tích luỹ không mất (write-side); spec: enduser-docs-authoring.md
- enduser-docs-index — chỉ mục đọc-theo-tag máy-đọc-được của tài liệu người-dùng-cuối, sinh từ cây tài liệu + capture (`fgos docs-index`), giữ móc truy ngược tài liệu↔việc, và verb `fgos doc-sources` gom mọi capture của một đường dẫn (read-side); spec: enduser-docs-index.md
- runner — vòng tự hành: lấy việc từ frontier, giao trợ lý nền trong nhánh cô lập, tự chấm, ghi đề xuất chờ duyệt; spec: runner.md
- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md
- distribution — cài `fgos` từ ngoài source repo (npm install qua GitHub); spec: distribution.md
- decision-citation-drift — quét backlog/spec tìm dòng còn trích một quyết định đã bị supersede mà không nhắc quyết định thay thế (chỉ phát hiện, không tự sửa); spec: decision-citation-drift.md
- distillery — vùng học từ reference sources: index feature từng nguồn, so sánh chéo, porting log; spec: distillery.md (partial — chỉ phủ porting lifecycle, xem Open Gaps trong spec đó)
- distill-skill — skill portable vận hành vòng học (init/add/delta/seal/check); spec: chưa có (harvest sẽ viết)
- convention — nguồn quy tắc máy-chạy được cho sinh/kiểm tên và vị trí repository-relative, không sở hữu state hay sức khoẻ thân tài liệu; trạng thái implemented; spec: `../platform/convention/spec.md`
```

### Full target shown text

```text
## Area Map

- platform-foundations — 8 luật thiết kế đã khóa đứng trên mọi code của compound stack; spec: platform-foundations.md
- work-state — bộ nhớ công việc tự quản của forgent (cửa lệnh `fgos`, nhật ký sự kiện là truth, bản chiếu dựng lại được); spec: work-state.md
- enduser-docs-authoring — soạn & nuôi tài liệu người-dùng-cuối ở khâu tổng-hợp, tức khi việc mang status `retrospective`: biến capture thật thành tài liệu theo ngăn Diataxis, một tài liệu sống trên mỗi đường dẫn, tích luỹ không mất (write-side); spec: enduser-docs-authoring.md
- enduser-docs-index — chỉ mục đọc-theo-tag máy-đọc-được của tài liệu người-dùng-cuối, sinh từ cây tài liệu + capture (`fgos docs-index`), giữ móc truy ngược tài liệu↔việc, và verb `fgos doc-sources` gom mọi capture của một đường dẫn (read-side); spec: enduser-docs-index.md
- runner — vòng tự hành: lấy việc từ frontier, giao trợ lý nền trong nhánh cô lập, tự chấm, ghi đề xuất chờ duyệt; spec: runner.md
- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md
- distribution — cài `fgos` từ ngoài source repo (npm install qua GitHub); spec: distribution.md
- decision-citation-drift — quét backlog/spec tìm dòng còn trích một quyết định đã bị supersede mà không nhắc quyết định thay thế (chỉ phát hiện, không tự sửa); spec: decision-citation-drift.md
- distillery — vùng học từ reference sources: index feature từng nguồn, so sánh chéo, porting log; spec: distillery.md (partial — chỉ phủ porting lifecycle, xem Open Gaps trong spec đó)
- distill-skill — skill portable vận hành vòng học (init/add/delta/seal/check); spec: chưa có (harvest sẽ viết)
- convention — nguồn quy tắc máy-chạy được cho sinh/kiểm tên và vị trí repository-relative, không sở hữu state hay sức khoẻ thân tài liệu; trạng thái implemented; spec: `../platform/convention/spec.md`
```

### Unified diff

```diff
No text difference.
```

## claim_49dc8dc05b31bcfc5cfd0d7c44c8395e

Source: `docs/specs/system-overview.md#unheaded-block-3`. Target: `docs/platform/system-overview/spec.md#unheaded-block-6`.

Mechanical class: Unit-exact. Source digest: `b5b8e930c4f4411020e3a8559798e1703e8b6e984487ef0d83b318c3c9a7f781`. Target digest: `b5b8e930c4f4411020e3a8559798e1703e8b6e984487ef0d83b318c3c9a7f781`.

Full shown source SHA256: `b5b8e930c4f4411020e3a8559798e1703e8b6e984487ef0d83b318c3c9a7f781`. Full shown target SHA256: `b5b8e930c4f4411020e3a8559798e1703e8b6e984487ef0d83b318c3c9a7f781`.

### Proposed decision

```json
{
  "claimId": "claim_49dc8dc05b31bcfc5cfd0d7c44c8395e",
  "sourceUnitDigest": "b5b8e930c4f4411020e3a8559798e1703e8b6e984487ef0d83b318c3c9a7f781",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "b5b8e930c4f4411020e3a8559798e1703e8b6e984487ef0d83b318c3c9a7f781",
  "targetAncestry": [
    "Spec: System Overview",
    "Area Map"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-3 (lines 14–24) into docs/platform/system-overview/spec.md#unheaded-block-6 (lines 42–52), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- platform-foundations — 8 luật thiết kế đã khóa đứng trên mọi code của compound stack; spec: platform-foundations.md
- work-state — bộ nhớ công việc tự quản của forgent (cửa lệnh `fgos`, nhật ký sự kiện là truth, bản chiếu dựng lại được); spec: work-state.md
- enduser-docs-authoring — soạn & nuôi tài liệu người-dùng-cuối ở khâu tổng-hợp, tức khi việc mang status `retrospective`: biến capture thật thành tài liệu theo ngăn Diataxis, một tài liệu sống trên mỗi đường dẫn, tích luỹ không mất (write-side); spec: enduser-docs-authoring.md
- enduser-docs-index — chỉ mục đọc-theo-tag máy-đọc-được của tài liệu người-dùng-cuối, sinh từ cây tài liệu + capture (`fgos docs-index`), giữ móc truy ngược tài liệu↔việc, và verb `fgos doc-sources` gom mọi capture của một đường dẫn (read-side); spec: enduser-docs-index.md
- runner — vòng tự hành: lấy việc từ frontier, giao trợ lý nền trong nhánh cô lập, tự chấm, ghi đề xuất chờ duyệt; spec: runner.md
- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md
- distribution — cài `fgos` từ ngoài source repo (npm install qua GitHub); spec: distribution.md
- decision-citation-drift — quét backlog/spec tìm dòng còn trích một quyết định đã bị supersede mà không nhắc quyết định thay thế (chỉ phát hiện, không tự sửa); spec: decision-citation-drift.md
- distillery — vùng học từ reference sources: index feature từng nguồn, so sánh chéo, porting log; spec: distillery.md (partial — chỉ phủ porting lifecycle, xem Open Gaps trong spec đó)
- distill-skill — skill portable vận hành vòng học (init/add/delta/seal/check); spec: chưa có (harvest sẽ viết)
- convention — nguồn quy tắc máy-chạy được cho sinh/kiểm tên và vị trí repository-relative, không sở hữu state hay sức khoẻ thân tài liệu; trạng thái implemented; spec: `../platform/convention/spec.md`
```

### Full target shown text

```text
- platform-foundations — 8 luật thiết kế đã khóa đứng trên mọi code của compound stack; spec: platform-foundations.md
- work-state — bộ nhớ công việc tự quản của forgent (cửa lệnh `fgos`, nhật ký sự kiện là truth, bản chiếu dựng lại được); spec: work-state.md
- enduser-docs-authoring — soạn & nuôi tài liệu người-dùng-cuối ở khâu tổng-hợp, tức khi việc mang status `retrospective`: biến capture thật thành tài liệu theo ngăn Diataxis, một tài liệu sống trên mỗi đường dẫn, tích luỹ không mất (write-side); spec: enduser-docs-authoring.md
- enduser-docs-index — chỉ mục đọc-theo-tag máy-đọc-được của tài liệu người-dùng-cuối, sinh từ cây tài liệu + capture (`fgos docs-index`), giữ móc truy ngược tài liệu↔việc, và verb `fgos doc-sources` gom mọi capture của một đường dẫn (read-side); spec: enduser-docs-index.md
- runner — vòng tự hành: lấy việc từ frontier, giao trợ lý nền trong nhánh cô lập, tự chấm, ghi đề xuất chờ duyệt; spec: runner.md
- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md
- distribution — cài `fgos` từ ngoài source repo (npm install qua GitHub); spec: distribution.md
- decision-citation-drift — quét backlog/spec tìm dòng còn trích một quyết định đã bị supersede mà không nhắc quyết định thay thế (chỉ phát hiện, không tự sửa); spec: decision-citation-drift.md
- distillery — vùng học từ reference sources: index feature từng nguồn, so sánh chéo, porting log; spec: distillery.md (partial — chỉ phủ porting lifecycle, xem Open Gaps trong spec đó)
- distill-skill — skill portable vận hành vòng học (init/add/delta/seal/check); spec: chưa có (harvest sẽ viết)
- convention — nguồn quy tắc máy-chạy được cho sinh/kiểm tên và vị trí repository-relative, không sở hữu state hay sức khoẻ thân tài liệu; trạng thái implemented; spec: `../platform/convention/spec.md`
```

### Unified diff

```diff
No text difference.
```

## claim_887f6acd1114101c50f2ca543492ee1c

Source: `docs/specs/system-overview.md#shared-entities`. Target: `docs/platform/system-overview/spec.md#shared-entities`.

Mechanical class: Weak-exact. Source digest: `274d42fb52e2875f80c1f5243d4e7e6dc4071b64cd031dbd8aecce0b43a542c6`. Target digest: `274d42fb52e2875f80c1f5243d4e7e6dc4071b64cd031dbd8aecce0b43a542c6`.

Full shown source SHA256: `1c9e62d26a0146deb05a6809c34cc168be084d0f287fb2b7bbc78990c403a695`. Full shown target SHA256: `1c9e62d26a0146deb05a6809c34cc168be084d0f287fb2b7bbc78990c403a695`.

### Proposed decision

```json
{
  "claimId": "claim_887f6acd1114101c50f2ca543492ee1c",
  "sourceUnitDigest": "274d42fb52e2875f80c1f5243d4e7e6dc4071b64cd031dbd8aecce0b43a542c6",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "shared-entities",
  "targetUnitDigest": "274d42fb52e2875f80c1f5243d4e7e6dc4071b64cd031dbd8aecce0b43a542c6",
  "targetAncestry": [
    "Spec: System Overview"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/specs/system-overview.md#shared-entities (lines 26–26) into docs/platform/system-overview/spec.md#shared-entities (lines 54–54), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## Shared Entities

| Entity | Meaning | Touched by |
|---|---|---|
| Nguồn tham chiếu (reference source) | Một repo/tài liệu ngoài được quét để học feature | distillery (owns), distill-skill (đọc/ghi index) |
| Luật nền (platform law) | Một luật thiết kế đã khóa, có D-ID và ngưỡng xem lại | platform-foundations (owns); mọi area tương lai tuân theo |
| Work item (`work`) | Đơn vị việc duy nhất của forgent: trạng thái FSM + deps phẳng + tier, đủ trường trả lời sáu câu harness. Một việc có thể đậu lại chờ người quyết (`awaiting-human`, mang câu hỏi) — bất đồng bộ, không chặn việc khác | work-state (owns), runner (đọc frontier — frontier LOẠI việc `awaiting-human`, runner không bao giờ pick việc đang chờ người) |
| Bản ghi kết quả (outcome) | Bản ghi hai nửa gắn theo id work item — dự đoán lúc nhận việc, thực tế lúc việc tới trạng thái cuối (thành công lẫn thất bại) — cộng dồn theo id, không bao giờ đè nhau; nguồn tín hiệu cho vòng học compound. Mang thêm nhãn Diataxis `docType` và con trỏ tài-liệu `docPath` (cộng-thêm, tùy chọn) khi capture khai — là móc linkage tài-liệu↔việc | work-state (owns fold + đọc qua `fgos metrics outcomes`...
| Cổng chờ-người (human-gate) | Điểm một việc dừng chờ người quyết trước khi đi tiếp; mang cặp câu hỏi/câu trả lời gộp theo id. Primitive chung — spine cho mọi cổng-người của vòng đời (intake, exploring, planning, review PR) | work-state (owns — verb `fgos ask`/`answer`, đọc qua `fgos list`) |

[unknown — các entity khác cần harvest interview; xem Open Gaps]
```

### Full target shown text

```text
## Shared Entities

| Entity | Meaning | Touched by |
|---|---|---|
| Nguồn tham chiếu (reference source) | Một repo/tài liệu ngoài được quét để học feature | distillery (owns), distill-skill (đọc/ghi index) |
| Luật nền (platform law) | Một luật thiết kế đã khóa, có D-ID và ngưỡng xem lại | platform-foundations (owns); mọi area tương lai tuân theo |
| Work item (`work`) | Đơn vị việc duy nhất của forgent: trạng thái FSM + deps phẳng + tier, đủ trường trả lời sáu câu harness. Một việc có thể đậu lại chờ người quyết (`awaiting-human`, mang câu hỏi) — bất đồng bộ, không chặn việc khác | work-state (owns), runner (đọc frontier — frontier LOẠI việc `awaiting-human`, runner không bao giờ pick việc đang chờ người) |
| Bản ghi kết quả (outcome) | Bản ghi hai nửa gắn theo id work item — dự đoán lúc nhận việc, thực tế lúc việc tới trạng thái cuối (thành công lẫn thất bại) — cộng dồn theo id, không bao giờ đè nhau; nguồn tín hiệu cho vòng học compound. Mang thêm nhãn Diataxis `docType` và con trỏ tài-liệu `docPath` (cộng-thêm, tùy chọn) khi capture khai — là móc linkage tài-liệu↔việc | work-state (owns fold + đọc qua `fgos metrics outcomes`...
| Cổng chờ-người (human-gate) | Điểm một việc dừng chờ người quyết trước khi đi tiếp; mang cặp câu hỏi/câu trả lời gộp theo id. Primitive chung — spine cho mọi cổng-người của vòng đời (intake, exploring, planning, review PR) | work-state (owns — verb `fgos ask`/`answer`, đọc qua `fgos list`) |

[unknown — các entity khác cần harvest interview; xem Open Gaps]
```

### Unified diff

```diff
No text difference.
```

## claim_8381c0c1fc4d9f00a3f04bcefd20a24e

Source: `docs/specs/system-overview.md#unheaded-block-4`. Target: `docs/platform/system-overview/spec.md#unheaded-block-7`.

Mechanical class: Unit-exact. Source digest: `de1f32c16d07dfa974a60da7cfe2f80d35cf47e1b16bb420e99f3f6353d4e983`. Target digest: `de1f32c16d07dfa974a60da7cfe2f80d35cf47e1b16bb420e99f3f6353d4e983`.

Full shown source SHA256: `de1f32c16d07dfa974a60da7cfe2f80d35cf47e1b16bb420e99f3f6353d4e983`. Full shown target SHA256: `de1f32c16d07dfa974a60da7cfe2f80d35cf47e1b16bb420e99f3f6353d4e983`.

### Proposed decision

```json
{
  "claimId": "claim_8381c0c1fc4d9f00a3f04bcefd20a24e",
  "sourceUnitDigest": "de1f32c16d07dfa974a60da7cfe2f80d35cf47e1b16bb420e99f3f6353d4e983",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "de1f32c16d07dfa974a60da7cfe2f80d35cf47e1b16bb420e99f3f6353d4e983",
  "targetAncestry": [
    "Spec: System Overview",
    "Shared Entities"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-4 (lines 28–34) into docs/platform/system-overview/spec.md#unheaded-block-7 (lines 56–62), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
| Entity | Meaning | Touched by |
|---|---|---|
| Nguồn tham chiếu (reference source) | Một repo/tài liệu ngoài được quét để học feature | distillery (owns), distill-skill (đọc/ghi index) |
| Luật nền (platform law) | Một luật thiết kế đã khóa, có D-ID và ngưỡng xem lại | platform-foundations (owns); mọi area tương lai tuân theo |
| Work item (`work`) | Đơn vị việc duy nhất của forgent: trạng thái FSM + deps phẳng + tier, đủ trường trả lời sáu câu harness. Một việc có thể đậu lại chờ người quyết (`awaiting-human`, mang câu hỏi) — bất đồng bộ, không chặn việc khác | work-state (owns), runner (đọc frontier — frontier LOẠI việc `awaiting-human`, runner không bao giờ pick việc đang chờ người) |
| Bản ghi kết quả (outcome) | Bản ghi hai nửa gắn theo id work item — dự đoán lúc nhận việc, thực tế lúc việc tới trạng thái cuối (thành công lẫn thất bại) — cộng dồn theo id, không bao giờ đè nhau; nguồn tín hiệu cho vòng học compound. Mang thêm nhãn Diataxis `docType` và con trỏ tài-liệu `docPath` (cộng-thêm, tùy chọn) khi capture khai — là móc linkage tài-liệu↔việc | work-state (owns fold + đọc qua `fgos metrics outcomes`...
| Cổng chờ-người (human-gate) | Điểm một việc dừng chờ người quyết trước khi đi tiếp; mang cặp câu hỏi/câu trả lời gộp theo id. Primitive chung — spine cho mọi cổng-người của vòng đời (intake, exploring, planning, review PR) | work-state (owns — verb `fgos ask`/`answer`, đọc qua `fgos list`) |
```

### Full target shown text

```text
| Entity | Meaning | Touched by |
|---|---|---|
| Nguồn tham chiếu (reference source) | Một repo/tài liệu ngoài được quét để học feature | distillery (owns), distill-skill (đọc/ghi index) |
| Luật nền (platform law) | Một luật thiết kế đã khóa, có D-ID và ngưỡng xem lại | platform-foundations (owns); mọi area tương lai tuân theo |
| Work item (`work`) | Đơn vị việc duy nhất của forgent: trạng thái FSM + deps phẳng + tier, đủ trường trả lời sáu câu harness. Một việc có thể đậu lại chờ người quyết (`awaiting-human`, mang câu hỏi) — bất đồng bộ, không chặn việc khác | work-state (owns), runner (đọc frontier — frontier LOẠI việc `awaiting-human`, runner không bao giờ pick việc đang chờ người) |
| Bản ghi kết quả (outcome) | Bản ghi hai nửa gắn theo id work item — dự đoán lúc nhận việc, thực tế lúc việc tới trạng thái cuối (thành công lẫn thất bại) — cộng dồn theo id, không bao giờ đè nhau; nguồn tín hiệu cho vòng học compound. Mang thêm nhãn Diataxis `docType` và con trỏ tài-liệu `docPath` (cộng-thêm, tùy chọn) khi capture khai — là móc linkage tài-liệu↔việc | work-state (owns fold + đọc qua `fgos metrics outcomes`...
| Cổng chờ-người (human-gate) | Điểm một việc dừng chờ người quyết trước khi đi tiếp; mang cặp câu hỏi/câu trả lời gộp theo id. Primitive chung — spine cho mọi cổng-người của vòng đời (intake, exploring, planning, review PR) | work-state (owns — verb `fgos ask`/`answer`, đọc qua `fgos list`) |
```

### Unified diff

```diff
No text difference.
```

## claim_dce63373ca9940516c1df19d74ab1faf

Source: `docs/specs/system-overview.md#unheaded-block-5`. Target: `docs/platform/system-overview/spec.md#unheaded-block-8`.

Mechanical class: Unit-exact. Source digest: `730cd052a180aefd91cfc16ed4ba307a12d1a6127dad9daa39dad0bac645cc08`. Target digest: `730cd052a180aefd91cfc16ed4ba307a12d1a6127dad9daa39dad0bac645cc08`.

Full shown source SHA256: `730cd052a180aefd91cfc16ed4ba307a12d1a6127dad9daa39dad0bac645cc08`. Full shown target SHA256: `730cd052a180aefd91cfc16ed4ba307a12d1a6127dad9daa39dad0bac645cc08`.

### Proposed decision

```json
{
  "claimId": "claim_dce63373ca9940516c1df19d74ab1faf",
  "sourceUnitDigest": "730cd052a180aefd91cfc16ed4ba307a12d1a6127dad9daa39dad0bac645cc08",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-8",
  "targetUnitDigest": "730cd052a180aefd91cfc16ed4ba307a12d1a6127dad9daa39dad0bac645cc08",
  "targetAncestry": [
    "Spec: System Overview",
    "Shared Entities"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-5 (lines 36–36) into docs/platform/system-overview/spec.md#unheaded-block-8 (lines 64–64), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
[unknown — các entity khác cần harvest interview; xem Open Gaps]
```

### Full target shown text

```text
[unknown — các entity khác cần harvest interview; xem Open Gaps]
```

### Unified diff

```diff
No text difference.
```

## claim_3f3de6f35122345a333dafeca6d5a1e2

Source: `docs/specs/system-overview.md#actors-roles-global`. Target: `docs/platform/system-overview/spec.md#actors-roles-global`.

Mechanical class: Weak-exact. Source digest: `73f0a66e6cbf9b14c75ca6bdead95abcfefcbdd009ecf5c2dba52ee7be4bcb8c`. Target digest: `73f0a66e6cbf9b14c75ca6bdead95abcfefcbdd009ecf5c2dba52ee7be4bcb8c`.

Full shown source SHA256: `6ee390f7043c3978611575a17a954a2fcdfc124ca9451434354d5d2353d77ce1`. Full shown target SHA256: `6ee390f7043c3978611575a17a954a2fcdfc124ca9451434354d5d2353d77ce1`.

### Proposed decision

```json
{
  "claimId": "claim_3f3de6f35122345a333dafeca6d5a1e2",
  "sourceUnitDigest": "73f0a66e6cbf9b14c75ca6bdead95abcfefcbdd009ecf5c2dba52ee7be4bcb8c",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "actors-roles-global",
  "targetUnitDigest": "73f0a66e6cbf9b14c75ca6bdead95abcfefcbdd009ecf5c2dba52ee7be4bcb8c",
  "targetAncestry": [
    "Spec: System Overview"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/specs/system-overview.md#actors-roles-global (lines 38–38) into docs/platform/system-overview/spec.md#actors-roles-global (lines 66–66), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## Actors & Roles (global)

- Product owner (user) — khóa/supersede luật, duyệt gate, chốt quyết định sản phẩm.
- Agent (Claude/Codex session) — đọc doctrine + spec, thi hành công việc, capture settlement.
- Worker (trợ lý nền do runner phái) — làm MỘT việc trong nhánh cô lập, chỉ để lại commit; không ghi trạng thái, không sửa cây chính.

[unknown — vai trò khác nếu có, cần harvest]
```

### Full target shown text

```text
## Actors & Roles (global)

- Product owner (user) — khóa/supersede luật, duyệt gate, chốt quyết định sản phẩm.
- Agent (Claude/Codex session) — đọc doctrine + spec, thi hành công việc, capture settlement.
- Worker (trợ lý nền do runner phái) — làm MỘT việc trong nhánh cô lập, chỉ để lại commit; không ghi trạng thái, không sửa cây chính.

[unknown — vai trò khác nếu có, cần harvest]
```

### Unified diff

```diff
No text difference.
```

## claim_cb0e8fc8b55307809c7d26873d7d03a0

Source: `docs/specs/system-overview.md#unheaded-block-6`. Target: `docs/platform/system-overview/spec.md#unheaded-block-9`.

Mechanical class: Unit-exact. Source digest: `c5f8d2fed54f529f3ce29163807c1c8c2a4e927d0d8830676d15e7aea4b1cace`. Target digest: `c5f8d2fed54f529f3ce29163807c1c8c2a4e927d0d8830676d15e7aea4b1cace`.

Full shown source SHA256: `c5f8d2fed54f529f3ce29163807c1c8c2a4e927d0d8830676d15e7aea4b1cace`. Full shown target SHA256: `c5f8d2fed54f529f3ce29163807c1c8c2a4e927d0d8830676d15e7aea4b1cace`.

### Proposed decision

```json
{
  "claimId": "claim_cb0e8fc8b55307809c7d26873d7d03a0",
  "sourceUnitDigest": "c5f8d2fed54f529f3ce29163807c1c8c2a4e927d0d8830676d15e7aea4b1cace",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-9",
  "targetUnitDigest": "c5f8d2fed54f529f3ce29163807c1c8c2a4e927d0d8830676d15e7aea4b1cace",
  "targetAncestry": [
    "Spec: System Overview",
    "Actors & Roles (global)"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-6 (lines 40–42) into docs/platform/system-overview/spec.md#unheaded-block-9 (lines 68–70), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- Product owner (user) — khóa/supersede luật, duyệt gate, chốt quyết định sản phẩm.
- Agent (Claude/Codex session) — đọc doctrine + spec, thi hành công việc, capture settlement.
- Worker (trợ lý nền do runner phái) — làm MỘT việc trong nhánh cô lập, chỉ để lại commit; không ghi trạng thái, không sửa cây chính.
```

### Full target shown text

```text
- Product owner (user) — khóa/supersede luật, duyệt gate, chốt quyết định sản phẩm.
- Agent (Claude/Codex session) — đọc doctrine + spec, thi hành công việc, capture settlement.
- Worker (trợ lý nền do runner phái) — làm MỘT việc trong nhánh cô lập, chỉ để lại commit; không ghi trạng thái, không sửa cây chính.
```

### Unified diff

```diff
No text difference.
```

## claim_6647fde52ef57c40838e20a221e05428

Source: `docs/specs/system-overview.md#unheaded-block-7`. Target: `docs/platform/system-overview/spec.md#unheaded-block-10`.

Mechanical class: Unit-exact. Source digest: `a74a9efa1cc5f4c96bff744054e1bff2fdd85d847a96df4ad36559c830e8c548`. Target digest: `a74a9efa1cc5f4c96bff744054e1bff2fdd85d847a96df4ad36559c830e8c548`.

Full shown source SHA256: `a74a9efa1cc5f4c96bff744054e1bff2fdd85d847a96df4ad36559c830e8c548`. Full shown target SHA256: `a74a9efa1cc5f4c96bff744054e1bff2fdd85d847a96df4ad36559c830e8c548`.

### Proposed decision

```json
{
  "claimId": "claim_6647fde52ef57c40838e20a221e05428",
  "sourceUnitDigest": "a74a9efa1cc5f4c96bff744054e1bff2fdd85d847a96df4ad36559c830e8c548",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-10",
  "targetUnitDigest": "a74a9efa1cc5f4c96bff744054e1bff2fdd85d847a96df4ad36559c830e8c548",
  "targetAncestry": [
    "Spec: System Overview",
    "Actors & Roles (global)"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-7 (lines 44–44) into docs/platform/system-overview/spec.md#unheaded-block-10 (lines 72–72), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
[unknown — vai trò khác nếu có, cần harvest]
```

### Full target shown text

```text
[unknown — vai trò khác nếu có, cần harvest]
```

### Unified diff

```diff
No text difference.
```

## claim_08c5b7ce94cdab6356032921c2b4b3a4

Source: `docs/specs/system-overview.md#cross-area-flows`. Target: `docs/platform/system-overview/spec.md#cross-area-flows`.

Mechanical class: Weak-exact. Source digest: `dbd9cb5c7cc62802128a86b28627f05119d94d00e947d21099ad13f0d4d53a41`. Target digest: `dbd9cb5c7cc62802128a86b28627f05119d94d00e947d21099ad13f0d4d53a41`.

Full shown source SHA256: `d621e85b5915ec3879b9736f740e410f2e9838dbd4c9f1830140a78115f743c8`. Full shown target SHA256: `d621e85b5915ec3879b9736f740e410f2e9838dbd4c9f1830140a78115f743c8`.

### Proposed decision

```json
{
  "claimId": "claim_08c5b7ce94cdab6356032921c2b4b3a4",
  "sourceUnitDigest": "dbd9cb5c7cc62802128a86b28627f05119d94d00e947d21099ad13f0d4d53a41",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "cross-area-flows",
  "targetUnitDigest": "dbd9cb5c7cc62802128a86b28627f05119d94d00e947d21099ad13f0d4d53a41",
  "targetAncestry": [
    "Spec: System Overview"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/specs/system-overview.md#cross-area-flows (lines 46–46) into docs/platform/system-overview/spec.md#cross-area-flows (lines 74–74), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## Cross-Area Flows

**Vòng tự hành việc (work-state ↔ runner):** người vận hành khai việc (`fgos add`) → runner `--once` lấy việc sẵn-sàng từ frontier → claim `doing` (runner ghi nửa dự đoán của bản ghi outcome) → trợ lý nền làm trong nhánh `fgw/` → runner tự chấm bằng proof của việc → đạt: `awaiting-approval` (đề xuất + nhánh, runner ghi nửa thực tế) → NGƯỜI duyệt qua cổng `review`/`approve`/`reject` — một cổng duy nhất cho mọi đề xuất (xem "Cổng duyệt PR nội bộ" dưới) — merge sạch tự động khi duyệt → `done` → việc phụ thuộc mở khóa. Trượt/lỗi: bảng phục hồi → thử-lại/đỗ-lại (ghi nửa thực tế)/dừng (ghi nửa thực tế); một cổng duyệt gãy (merge conflict hoặc verify đỏ sau merge) đậu đề xuất lại ở `blocked` mang lý do, không tự rebase, không halt cả vòng. Cả hai nửa đọc lại được qua `fgos check` — nguồn của vòng học compound.

**Cổng duyệt PR nội bộ (work-state ↔ runner):** một đề xuất `awaiting-approval` — dù đến từ runner (nhánh `fgw/<id>`) hay từ cửa pull `take`/`return` (dải commit) — đi qua CÙNG một cổng: `review` (xem diff), `approve` (merge nếu có nhánh, rồi verify; hoặc chỉ verify nếu code đã trên main), `reject` (từ chối, không revert). Duyệt sạch đóng cạnh `→done` mang role NGƯỜI; gãy đóng cạnh MỚI `awaiting-approval→blocked` mang lý do. Xem docs/specs/runner.md "Cổng duyệt PR nội bộ" cho hợp đồng đầy đủ.

**Cửa pull giao–nhận việc (work-state, thay thế runner cho MỘT item):** một tác nhân ngoài runner — người, một phiên đang sống, hay một runner thứ hai — `fgos take` đúng một item từ CÙNG tập frontier runner dùng, rồi tự `fgos return`; `return` không tin lời người gọi, tự đo working tree sạch + HEAD tiến + verify thật trước khi item thành `awaiting-approval` mang `headAtReturn` — mirror đúng contract `awaiting-approval` của runner. Gặt-lại lúc khởi động của runner không bao giờ giẫm lên claim này (xem docs/specs/work-state.md "Cửa pull giao–nhận việc", docs/specs/runner.md). Dải `headAtTake→headAtReturn` là nguồn diff của đề xuất này khi nó tới cổng duyệt PR nội bộ (trên).

**Vòng tài liệu người-dùng-cuối (enduser-docs-authoring → enduser-docs-index):** khi việc mang status `retrospective`, kỷ luật soạn tài liệu đọc capture thật của việc, phân đúng một ngăn Diataxis, lưu tag + móc đường-dẫn lên capture (`fgos compound --doc-type --doc-path`), gom **mọi** capture của đường dẫn đó (`fgos doc-sources`), rồi grow-or-create một tài liệu sống theo tồn-tại-tệp — tích luỹ không mất (write-side). Sau đó `fgos docs-index` liệt kê tài liệu và truy ngược mỗi tài liệu về capture qua `docPath` (read-side); tài liệu how-to đầu tiên nay liên kết thật tới capture `doc-fgos-rollup-howto`. Ngăn Diataxis là trục cấu trúc duy nhất; purpose/audience là metadata, không phải trục thứ hai.

**Hướng mặt-người đa-surface (đã chốt, chưa xây — backlog STR37/STR38, per D b2d18cc7):** mọi mặt người — cửa lệnh hôm nay, web/chat/webhook mai sau — là DA; ruột chỉ có một, và chỗ da gặp ruột là hợp đồng cửa-lệnh (envelope kết quả + phân loại exit đóng). Một listener nhận transport ngoài (web/chat) sống ở đất host-adapter và DỊCH yêu cầu thành verb — gọi cửa lệnh như một người dùng, không bao giờ mở đường ghi riêng; kèm cổng xác danh "ai được nói verb nào" trước khi dịch (mô tả tự do đổ vào intake là vector tiêm lệnh vì proof của việc chạy như lệnh — nguồn chưa kiểm phải qua cổng). Chuẩn hóa đi trước **đã xong** (STR37): envelope bọc kết quả trên MỌI verb qua một cửa in duy nhất + một manifest verb máy-đọc (`--help --json`, mỗi verb có cờ `access` read/mutation) để mọi surface sinh giao diện từ manifest thay vì hard-code. Còn lại của hướng này: listener host-adapter + cổng xác danh (backlog STR38). Chiều hệ→người chủ động (kênh chú-ý) chưa xây — surface tạm poll danh sách việc + so hash thay đổi của envelope; poll bắt đầu khó chịu là tín hiệu kênh chú-ý đến lượt.

[unknown — vòng học distillery → porting → platform law cần harvest xác nhận từng bước; xem Open Gaps]
```

### Full target shown text

```text
## Cross-Area Flows

**Vòng tự hành việc (work-state ↔ runner):** người vận hành khai việc (`fgos add`) → runner `--once` lấy việc sẵn-sàng từ frontier → claim `doing` (runner ghi nửa dự đoán của bản ghi outcome) → trợ lý nền làm trong nhánh `fgw/` → runner tự chấm bằng proof của việc → đạt: `awaiting-approval` (đề xuất + nhánh, runner ghi nửa thực tế) → NGƯỜI duyệt qua cổng `review`/`approve`/`reject` — một cổng duy nhất cho mọi đề xuất (xem "Cổng duyệt PR nội bộ" dưới) — merge sạch tự động khi duyệt → `done` → việc phụ thuộc mở khóa. Trượt/lỗi: bảng phục hồi → thử-lại/đỗ-lại (ghi nửa thực tế)/dừng (ghi nửa thực tế); một cổng duyệt gãy (merge conflict hoặc verify đỏ sau merge) đậu đề xuất lại ở `blocked` mang lý do, không tự rebase, không halt cả vòng. Cả hai nửa đọc lại được qua `fgos check` — nguồn của vòng học compound.

**Cổng duyệt PR nội bộ (work-state ↔ runner):** một đề xuất `awaiting-approval` — dù đến từ runner (nhánh `fgw/<id>`) hay từ cửa pull `take`/`return` (dải commit) — đi qua CÙNG một cổng: `review` (xem diff), `approve` (merge nếu có nhánh, rồi verify; hoặc chỉ verify nếu code đã trên main), `reject` (từ chối, không revert). Duyệt sạch đóng cạnh `→done` mang role NGƯỜI; gãy đóng cạnh MỚI `awaiting-approval→blocked` mang lý do. Xem docs/specs/runner.md "Cổng duyệt PR nội bộ" cho hợp đồng đầy đủ.

**Cửa pull giao–nhận việc (work-state, thay thế runner cho MỘT item):** một tác nhân ngoài runner — người, một phiên đang sống, hay một runner thứ hai — `fgos take` đúng một item từ CÙNG tập frontier runner dùng, rồi tự `fgos return`; `return` không tin lời người gọi, tự đo working tree sạch + HEAD tiến + verify thật trước khi item thành `awaiting-approval` mang `headAtReturn` — mirror đúng contract `awaiting-approval` của runner. Gặt-lại lúc khởi động của runner không bao giờ giẫm lên claim này (xem docs/specs/work-state.md "Cửa pull giao–nhận việc", docs/specs/runner.md). Dải `headAtTake→headAtReturn` là nguồn diff của đề xuất này khi nó tới cổng duyệt PR nội bộ (trên).

**Vòng tài liệu người-dùng-cuối (enduser-docs-authoring → enduser-docs-index):** khi việc mang status `retrospective`, kỷ luật soạn tài liệu đọc capture thật của việc, phân đúng một ngăn Diataxis, lưu tag + móc đường-dẫn lên capture (`fgos compound --doc-type --doc-path`), gom **mọi** capture của đường dẫn đó (`fgos doc-sources`), rồi grow-or-create một tài liệu sống theo tồn-tại-tệp — tích luỹ không mất (write-side). Sau đó `fgos docs-index` liệt kê tài liệu và truy ngược mỗi tài liệu về capture qua `docPath` (read-side); tài liệu how-to đầu tiên nay liên kết thật tới capture `doc-fgos-rollup-howto`. Ngăn Diataxis là trục cấu trúc duy nhất; purpose/audience là metadata, không phải trục thứ hai.

**Hướng mặt-người đa-surface (đã chốt, chưa xây — backlog STR37/STR38, per D b2d18cc7):** mọi mặt người — cửa lệnh hôm nay, web/chat/webhook mai sau — là DA; ruột chỉ có một, và chỗ da gặp ruột là hợp đồng cửa-lệnh (envelope kết quả + phân loại exit đóng). Một listener nhận transport ngoài (web/chat) sống ở đất host-adapter và DỊCH yêu cầu thành verb — gọi cửa lệnh như một người dùng, không bao giờ mở đường ghi riêng; kèm cổng xác danh "ai được nói verb nào" trước khi dịch (mô tả tự do đổ vào intake là vector tiêm lệnh vì proof của việc chạy như lệnh — nguồn chưa kiểm phải qua cổng). Chuẩn hóa đi trước **đã xong** (STR37): envelope bọc kết quả trên MỌI verb qua một cửa in duy nhất + một manifest verb máy-đọc (`--help --json`, mỗi verb có cờ `access` read/mutation) để mọi surface sinh giao diện từ manifest thay vì hard-code. Còn lại của hướng này: listener host-adapter + cổng xác danh (backlog STR38). Chiều hệ→người chủ động (kênh chú-ý) chưa xây — surface tạm poll danh sách việc + so hash thay đổi của envelope; poll bắt đầu khó chịu là tín hiệu kênh chú-ý đến lượt.

[unknown — vòng học distillery → porting → platform law cần harvest xác nhận từng bước; xem Open Gaps]
```

### Unified diff

```diff
No text difference.
```

## claim_6bec1461e3dc739ac9117aba01921ec5

Source: `docs/specs/system-overview.md#unheaded-block-8`. Target: `docs/platform/system-overview/spec.md#unheaded-block-11`.

Mechanical class: Unit-exact. Source digest: `cb78d4e7647dddbf374827bedeb16e368b5804647177a78206d979b44ab608d1`. Target digest: `cb78d4e7647dddbf374827bedeb16e368b5804647177a78206d979b44ab608d1`.

Full shown source SHA256: `cb78d4e7647dddbf374827bedeb16e368b5804647177a78206d979b44ab608d1`. Full shown target SHA256: `cb78d4e7647dddbf374827bedeb16e368b5804647177a78206d979b44ab608d1`.

### Proposed decision

```json
{
  "claimId": "claim_6bec1461e3dc739ac9117aba01921ec5",
  "sourceUnitDigest": "cb78d4e7647dddbf374827bedeb16e368b5804647177a78206d979b44ab608d1",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-11",
  "targetUnitDigest": "cb78d4e7647dddbf374827bedeb16e368b5804647177a78206d979b44ab608d1",
  "targetAncestry": [
    "Spec: System Overview",
    "Cross-Area Flows"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-8 (lines 48–48) into docs/platform/system-overview/spec.md#unheaded-block-11 (lines 76–76), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
**Vòng tự hành việc (work-state ↔ runner):** người vận hành khai việc (`fgos add`) → runner `--once` lấy việc sẵn-sàng từ frontier → claim `doing` (runner ghi nửa dự đoán của bản ghi outcome) → trợ lý nền làm trong nhánh `fgw/` → runner tự chấm bằng proof của việc → đạt: `awaiting-approval` (đề xuất + nhánh, runner ghi nửa thực tế) → NGƯỜI duyệt qua cổng `review`/`approve`/`reject` — một cổng duy nhất cho mọi đề xuất (xem "Cổng duyệt PR nội bộ" dưới) — merge sạch tự động khi duyệt → `done` → việc phụ thuộc mở khóa. Trượt/lỗi: bảng phục hồi → thử-lại/đỗ-lại (ghi nửa thực tế)/dừng (ghi nửa thực tế); một cổng duyệt gãy (merge conflict hoặc verify đỏ sau merge) đậu đề xuất lại ở `blocked` mang lý do, không tự rebase, không halt cả vòng. Cả hai nửa đọc lại được qua `fgos check` — nguồn của vòng học compound.
```

### Full target shown text

```text
**Vòng tự hành việc (work-state ↔ runner):** người vận hành khai việc (`fgos add`) → runner `--once` lấy việc sẵn-sàng từ frontier → claim `doing` (runner ghi nửa dự đoán của bản ghi outcome) → trợ lý nền làm trong nhánh `fgw/` → runner tự chấm bằng proof của việc → đạt: `awaiting-approval` (đề xuất + nhánh, runner ghi nửa thực tế) → NGƯỜI duyệt qua cổng `review`/`approve`/`reject` — một cổng duy nhất cho mọi đề xuất (xem "Cổng duyệt PR nội bộ" dưới) — merge sạch tự động khi duyệt → `done` → việc phụ thuộc mở khóa. Trượt/lỗi: bảng phục hồi → thử-lại/đỗ-lại (ghi nửa thực tế)/dừng (ghi nửa thực tế); một cổng duyệt gãy (merge conflict hoặc verify đỏ sau merge) đậu đề xuất lại ở `blocked` mang lý do, không tự rebase, không halt cả vòng. Cả hai nửa đọc lại được qua `fgos check` — nguồn của vòng học compound.
```

### Unified diff

```diff
No text difference.
```

## claim_7e5bc8ddaf2cfc956be0abb3cdea3198

Source: `docs/specs/system-overview.md#unheaded-block-9`. Target: `docs/platform/system-overview/spec.md#unheaded-block-12`.

Mechanical class: Unit-exact. Source digest: `9359f8a70683513071a68a1d9a151301a4f377e6a3fd95bad3af1e35f37e7c38`. Target digest: `9359f8a70683513071a68a1d9a151301a4f377e6a3fd95bad3af1e35f37e7c38`.

Full shown source SHA256: `9359f8a70683513071a68a1d9a151301a4f377e6a3fd95bad3af1e35f37e7c38`. Full shown target SHA256: `9359f8a70683513071a68a1d9a151301a4f377e6a3fd95bad3af1e35f37e7c38`.

### Proposed decision

```json
{
  "claimId": "claim_7e5bc8ddaf2cfc956be0abb3cdea3198",
  "sourceUnitDigest": "9359f8a70683513071a68a1d9a151301a4f377e6a3fd95bad3af1e35f37e7c38",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-12",
  "targetUnitDigest": "9359f8a70683513071a68a1d9a151301a4f377e6a3fd95bad3af1e35f37e7c38",
  "targetAncestry": [
    "Spec: System Overview",
    "Cross-Area Flows"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-9 (lines 50–50) into docs/platform/system-overview/spec.md#unheaded-block-12 (lines 78–78), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
**Cổng duyệt PR nội bộ (work-state ↔ runner):** một đề xuất `awaiting-approval` — dù đến từ runner (nhánh `fgw/<id>`) hay từ cửa pull `take`/`return` (dải commit) — đi qua CÙNG một cổng: `review` (xem diff), `approve` (merge nếu có nhánh, rồi verify; hoặc chỉ verify nếu code đã trên main), `reject` (từ chối, không revert). Duyệt sạch đóng cạnh `→done` mang role NGƯỜI; gãy đóng cạnh MỚI `awaiting-approval→blocked` mang lý do. Xem docs/specs/runner.md "Cổng duyệt PR nội bộ" cho hợp đồng đầy đủ.
```

### Full target shown text

```text
**Cổng duyệt PR nội bộ (work-state ↔ runner):** một đề xuất `awaiting-approval` — dù đến từ runner (nhánh `fgw/<id>`) hay từ cửa pull `take`/`return` (dải commit) — đi qua CÙNG một cổng: `review` (xem diff), `approve` (merge nếu có nhánh, rồi verify; hoặc chỉ verify nếu code đã trên main), `reject` (từ chối, không revert). Duyệt sạch đóng cạnh `→done` mang role NGƯỜI; gãy đóng cạnh MỚI `awaiting-approval→blocked` mang lý do. Xem docs/specs/runner.md "Cổng duyệt PR nội bộ" cho hợp đồng đầy đủ.
```

### Unified diff

```diff
No text difference.
```

## claim_68656421f5f066ff082de4cc3b52111e

Source: `docs/specs/system-overview.md#unheaded-block-10`. Target: `docs/platform/system-overview/spec.md#unheaded-block-13`.

Mechanical class: Unit-exact. Source digest: `82cbefae49cde41a3af4d5bd97e34c6bb4a92f63a969aa20be52a79d149a59c8`. Target digest: `82cbefae49cde41a3af4d5bd97e34c6bb4a92f63a969aa20be52a79d149a59c8`.

Full shown source SHA256: `82cbefae49cde41a3af4d5bd97e34c6bb4a92f63a969aa20be52a79d149a59c8`. Full shown target SHA256: `82cbefae49cde41a3af4d5bd97e34c6bb4a92f63a969aa20be52a79d149a59c8`.

### Proposed decision

```json
{
  "claimId": "claim_68656421f5f066ff082de4cc3b52111e",
  "sourceUnitDigest": "82cbefae49cde41a3af4d5bd97e34c6bb4a92f63a969aa20be52a79d149a59c8",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-13",
  "targetUnitDigest": "82cbefae49cde41a3af4d5bd97e34c6bb4a92f63a969aa20be52a79d149a59c8",
  "targetAncestry": [
    "Spec: System Overview",
    "Cross-Area Flows"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-10 (lines 52–52) into docs/platform/system-overview/spec.md#unheaded-block-13 (lines 80–80), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
**Cửa pull giao–nhận việc (work-state, thay thế runner cho MỘT item):** một tác nhân ngoài runner — người, một phiên đang sống, hay một runner thứ hai — `fgos take` đúng một item từ CÙNG tập frontier runner dùng, rồi tự `fgos return`; `return` không tin lời người gọi, tự đo working tree sạch + HEAD tiến + verify thật trước khi item thành `awaiting-approval` mang `headAtReturn` — mirror đúng contract `awaiting-approval` của runner. Gặt-lại lúc khởi động của runner không bao giờ giẫm lên claim này (xem docs/specs/work-state.md "Cửa pull giao–nhận việc", docs/specs/runner.md). Dải `headAtTake→headAtReturn` là nguồn diff của đề xuất này khi nó tới cổng duyệt PR nội bộ (trên).
```

### Full target shown text

```text
**Cửa pull giao–nhận việc (work-state, thay thế runner cho MỘT item):** một tác nhân ngoài runner — người, một phiên đang sống, hay một runner thứ hai — `fgos take` đúng một item từ CÙNG tập frontier runner dùng, rồi tự `fgos return`; `return` không tin lời người gọi, tự đo working tree sạch + HEAD tiến + verify thật trước khi item thành `awaiting-approval` mang `headAtReturn` — mirror đúng contract `awaiting-approval` của runner. Gặt-lại lúc khởi động của runner không bao giờ giẫm lên claim này (xem docs/specs/work-state.md "Cửa pull giao–nhận việc", docs/specs/runner.md). Dải `headAtTake→headAtReturn` là nguồn diff của đề xuất này khi nó tới cổng duyệt PR nội bộ (trên).
```

### Unified diff

```diff
No text difference.
```

## claim_c66ccefbcde133dcdd40e41c671e20df

Source: `docs/specs/system-overview.md#unheaded-block-11`. Target: `docs/platform/system-overview/spec.md#unheaded-block-14`.

Mechanical class: Unit-exact. Source digest: `b6add9275396beb533908c00a968856dabe044ff705294d6901a360cd20e4502`. Target digest: `b6add9275396beb533908c00a968856dabe044ff705294d6901a360cd20e4502`.

Full shown source SHA256: `b6add9275396beb533908c00a968856dabe044ff705294d6901a360cd20e4502`. Full shown target SHA256: `b6add9275396beb533908c00a968856dabe044ff705294d6901a360cd20e4502`.

### Proposed decision

```json
{
  "claimId": "claim_c66ccefbcde133dcdd40e41c671e20df",
  "sourceUnitDigest": "b6add9275396beb533908c00a968856dabe044ff705294d6901a360cd20e4502",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-14",
  "targetUnitDigest": "b6add9275396beb533908c00a968856dabe044ff705294d6901a360cd20e4502",
  "targetAncestry": [
    "Spec: System Overview",
    "Cross-Area Flows"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-11 (lines 54–54) into docs/platform/system-overview/spec.md#unheaded-block-14 (lines 82–82), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
**Vòng tài liệu người-dùng-cuối (enduser-docs-authoring → enduser-docs-index):** khi việc mang status `retrospective`, kỷ luật soạn tài liệu đọc capture thật của việc, phân đúng một ngăn Diataxis, lưu tag + móc đường-dẫn lên capture (`fgos compound --doc-type --doc-path`), gom **mọi** capture của đường dẫn đó (`fgos doc-sources`), rồi grow-or-create một tài liệu sống theo tồn-tại-tệp — tích luỹ không mất (write-side). Sau đó `fgos docs-index` liệt kê tài liệu và truy ngược mỗi tài liệu về capture qua `docPath` (read-side); tài liệu how-to đầu tiên nay liên kết thật tới capture `doc-fgos-rollup-howto`. Ngăn Diataxis là trục cấu trúc duy nhất; purpose/audience là metadata, không phải trục thứ hai.
```

### Full target shown text

```text
**Vòng tài liệu người-dùng-cuối (enduser-docs-authoring → enduser-docs-index):** khi việc mang status `retrospective`, kỷ luật soạn tài liệu đọc capture thật của việc, phân đúng một ngăn Diataxis, lưu tag + móc đường-dẫn lên capture (`fgos compound --doc-type --doc-path`), gom **mọi** capture của đường dẫn đó (`fgos doc-sources`), rồi grow-or-create một tài liệu sống theo tồn-tại-tệp — tích luỹ không mất (write-side). Sau đó `fgos docs-index` liệt kê tài liệu và truy ngược mỗi tài liệu về capture qua `docPath` (read-side); tài liệu how-to đầu tiên nay liên kết thật tới capture `doc-fgos-rollup-howto`. Ngăn Diataxis là trục cấu trúc duy nhất; purpose/audience là metadata, không phải trục thứ hai.
```

### Unified diff

```diff
No text difference.
```

## claim_c13dbf822e8fda9a76f788d61196f321

Source: `docs/specs/system-overview.md#unheaded-block-12`. Target: `docs/platform/system-overview/spec.md#unheaded-block-15`.

Mechanical class: Unit-exact. Source digest: `8dcf6693cff35b95ac1f839919388403df7544f3ed3a582555fba55762c567c5`. Target digest: `8dcf6693cff35b95ac1f839919388403df7544f3ed3a582555fba55762c567c5`.

Full shown source SHA256: `8dcf6693cff35b95ac1f839919388403df7544f3ed3a582555fba55762c567c5`. Full shown target SHA256: `8dcf6693cff35b95ac1f839919388403df7544f3ed3a582555fba55762c567c5`.

### Proposed decision

```json
{
  "claimId": "claim_c13dbf822e8fda9a76f788d61196f321",
  "sourceUnitDigest": "8dcf6693cff35b95ac1f839919388403df7544f3ed3a582555fba55762c567c5",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-15",
  "targetUnitDigest": "8dcf6693cff35b95ac1f839919388403df7544f3ed3a582555fba55762c567c5",
  "targetAncestry": [
    "Spec: System Overview",
    "Cross-Area Flows"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-12 (lines 56–56) into docs/platform/system-overview/spec.md#unheaded-block-15 (lines 84–84), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
**Hướng mặt-người đa-surface (đã chốt, chưa xây — backlog STR37/STR38, per D b2d18cc7):** mọi mặt người — cửa lệnh hôm nay, web/chat/webhook mai sau — là DA; ruột chỉ có một, và chỗ da gặp ruột là hợp đồng cửa-lệnh (envelope kết quả + phân loại exit đóng). Một listener nhận transport ngoài (web/chat) sống ở đất host-adapter và DỊCH yêu cầu thành verb — gọi cửa lệnh như một người dùng, không bao giờ mở đường ghi riêng; kèm cổng xác danh "ai được nói verb nào" trước khi dịch (mô tả tự do đổ vào intake là vector tiêm lệnh vì proof của việc chạy như lệnh — nguồn chưa kiểm phải qua cổng). Chuẩn hóa đi trước **đã xong** (STR37): envelope bọc kết quả trên MỌI verb qua một cửa in duy nhất + một manifest verb máy-đọc (`--help --json`, mỗi verb có cờ `access` read/mutation) để mọi surface sinh giao diện từ manifest thay vì hard-code. Còn lại của hướng này: listener host-adapter + cổng xác danh (backlog STR38). Chiều hệ→người chủ động (kênh chú-ý) chưa xây — surface tạm poll danh sách việc + so hash thay đổi của envelope; poll bắt đầu khó chịu là tín hiệu kênh chú-ý đến lượt.
```

### Full target shown text

```text
**Hướng mặt-người đa-surface (đã chốt, chưa xây — backlog STR37/STR38, per D b2d18cc7):** mọi mặt người — cửa lệnh hôm nay, web/chat/webhook mai sau — là DA; ruột chỉ có một, và chỗ da gặp ruột là hợp đồng cửa-lệnh (envelope kết quả + phân loại exit đóng). Một listener nhận transport ngoài (web/chat) sống ở đất host-adapter và DỊCH yêu cầu thành verb — gọi cửa lệnh như một người dùng, không bao giờ mở đường ghi riêng; kèm cổng xác danh "ai được nói verb nào" trước khi dịch (mô tả tự do đổ vào intake là vector tiêm lệnh vì proof của việc chạy như lệnh — nguồn chưa kiểm phải qua cổng). Chuẩn hóa đi trước **đã xong** (STR37): envelope bọc kết quả trên MỌI verb qua một cửa in duy nhất + một manifest verb máy-đọc (`--help --json`, mỗi verb có cờ `access` read/mutation) để mọi surface sinh giao diện từ manifest thay vì hard-code. Còn lại của hướng này: listener host-adapter + cổng xác danh (backlog STR38). Chiều hệ→người chủ động (kênh chú-ý) chưa xây — surface tạm poll danh sách việc + so hash thay đổi của envelope; poll bắt đầu khó chịu là tín hiệu kênh chú-ý đến lượt.
```

### Unified diff

```diff
No text difference.
```

## claim_38023cfbeb28203b1554b90f12ddce2b

Source: `docs/specs/system-overview.md#unheaded-block-13`. Target: `docs/platform/system-overview/spec.md#unheaded-block-16`.

Mechanical class: Unit-exact. Source digest: `856538cd1059e514a1fd8b63bb8411067b2b2e535035d645e52d9756d59361fb`. Target digest: `856538cd1059e514a1fd8b63bb8411067b2b2e535035d645e52d9756d59361fb`.

Full shown source SHA256: `856538cd1059e514a1fd8b63bb8411067b2b2e535035d645e52d9756d59361fb`. Full shown target SHA256: `856538cd1059e514a1fd8b63bb8411067b2b2e535035d645e52d9756d59361fb`.

### Proposed decision

```json
{
  "claimId": "claim_38023cfbeb28203b1554b90f12ddce2b",
  "sourceUnitDigest": "856538cd1059e514a1fd8b63bb8411067b2b2e535035d645e52d9756d59361fb",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-16",
  "targetUnitDigest": "856538cd1059e514a1fd8b63bb8411067b2b2e535035d645e52d9756d59361fb",
  "targetAncestry": [
    "Spec: System Overview",
    "Cross-Area Flows"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-13 (lines 58–58) into docs/platform/system-overview/spec.md#unheaded-block-16 (lines 86–86), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
[unknown — vòng học distillery → porting → platform law cần harvest xác nhận từng bước; xem Open Gaps]
```

### Full target shown text

```text
[unknown — vòng học distillery → porting → platform law cần harvest xác nhận từng bước; xem Open Gaps]
```

### Unified diff

```diff
No text difference.
```

## claim_7a885afe302bdf907cc84dc469360a2c

Source: `docs/specs/system-overview.md#open-gaps`. Target: `docs/platform/system-overview/spec.md#open-gaps`.

Mechanical class: Weak-exact. Source digest: `01990f162b647f9106bf2b23d20b6236c1bbdc2d92d25b1f7f2c41abbdf4e604`. Target digest: `01990f162b647f9106bf2b23d20b6236c1bbdc2d92d25b1f7f2c41abbdf4e604`.

Full shown source SHA256: `198b9e639eb5bbfb09c1cd7c560533aa766fce26b98324a935134499a1ceaa74`. Full shown target SHA256: `198b9e639eb5bbfb09c1cd7c560533aa766fce26b98324a935134499a1ceaa74`.

### Proposed decision

```json
{
  "claimId": "claim_7a885afe302bdf907cc84dc469360a2c",
  "sourceUnitDigest": "01990f162b647f9106bf2b23d20b6236c1bbdc2d92d25b1f7f2c41abbdf4e604",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "open-gaps",
  "targetUnitDigest": "01990f162b647f9106bf2b23d20b6236c1bbdc2d92d25b1f7f2c41abbdf4e604",
  "targetAncestry": [
    "Spec: System Overview"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/specs/system-overview.md#open-gaps (lines 60–60) into docs/platform/system-overview/spec.md#open-gaps (lines 88–88), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## Open Gaps

- distillery: spec chỉ phủ porting lifecycle (docs/specs/distillery.md) — các khả năng khác (tìm nguồn mới, so sánh chéo, xếp hạng candidate) chưa có spec.
- distill-skill: chưa có area spec — harvest từ SKILL.md + lệnh thực chạy (`init/add/delta/seal/check`).
- Shared entities ngoài 2 dòng đã liệt kê: cần harvest interview.
- Cross-area flow học→port→luật: các bước và actor quan sát gì ở mỗi bước — cần harvest.
```

### Full target shown text

```text
## Open Gaps

- distillery: spec chỉ phủ porting lifecycle (docs/specs/distillery.md) — các khả năng khác (tìm nguồn mới, so sánh chéo, xếp hạng candidate) chưa có spec.
- distill-skill: chưa có area spec — harvest từ SKILL.md + lệnh thực chạy (`init/add/delta/seal/check`).
- Shared entities ngoài 2 dòng đã liệt kê: cần harvest interview.
- Cross-area flow học→port→luật: các bước và actor quan sát gì ở mỗi bước — cần harvest.
```

### Unified diff

```diff
No text difference.
```

## claim_cce5604dcd39d43a3f785361b64f19c2

Source: `docs/specs/system-overview.md#unheaded-block-14`. Target: `docs/platform/system-overview/spec.md#unheaded-block-17`.

Mechanical class: Unit-exact. Source digest: `781246c6887cde3fb56a4e600cf48696b21126b5b7d322dc1f548a66099a5fec`. Target digest: `781246c6887cde3fb56a4e600cf48696b21126b5b7d322dc1f548a66099a5fec`.

Full shown source SHA256: `781246c6887cde3fb56a4e600cf48696b21126b5b7d322dc1f548a66099a5fec`. Full shown target SHA256: `781246c6887cde3fb56a4e600cf48696b21126b5b7d322dc1f548a66099a5fec`.

### Proposed decision

```json
{
  "claimId": "claim_cce5604dcd39d43a3f785361b64f19c2",
  "sourceUnitDigest": "781246c6887cde3fb56a4e600cf48696b21126b5b7d322dc1f548a66099a5fec",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-17",
  "targetUnitDigest": "781246c6887cde3fb56a4e600cf48696b21126b5b7d322dc1f548a66099a5fec",
  "targetAncestry": [
    "Spec: System Overview",
    "Open Gaps"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-14 (lines 62–65) into docs/platform/system-overview/spec.md#unheaded-block-17 (lines 90–93), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- distillery: spec chỉ phủ porting lifecycle (docs/specs/distillery.md) — các khả năng khác (tìm nguồn mới, so sánh chéo, xếp hạng candidate) chưa có spec.
- distill-skill: chưa có area spec — harvest từ SKILL.md + lệnh thực chạy (`init/add/delta/seal/check`).
- Shared entities ngoài 2 dòng đã liệt kê: cần harvest interview.
- Cross-area flow học→port→luật: các bước và actor quan sát gì ở mỗi bước — cần harvest.
```

### Full target shown text

```text
- distillery: spec chỉ phủ porting lifecycle (docs/specs/distillery.md) — các khả năng khác (tìm nguồn mới, so sánh chéo, xếp hạng candidate) chưa có spec.
- distill-skill: chưa có area spec — harvest từ SKILL.md + lệnh thực chạy (`init/add/delta/seal/check`).
- Shared entities ngoài 2 dòng đã liệt kê: cần harvest interview.
- Cross-area flow học→port→luật: các bước và actor quan sát gì ở mỗi bước — cần harvest.
```

### Unified diff

```diff
No text difference.
```

## claim_78601f92423c2254f7933d514867ab69

Source: `docs/specs/system-overview.md#pointers-implementation`. Target: `docs/platform/system-overview/spec.md#pointers-implementation`.

Mechanical class: Weak-exact. Source digest: `9f3ce69e3eed5edfea59ac8e4d7bdbdeb861fd8f2f9aa73ba6289cfc347204c4`. Target digest: `9f3ce69e3eed5edfea59ac8e4d7bdbdeb861fd8f2f9aa73ba6289cfc347204c4`.

Full shown source SHA256: `c8fa4e3b382b0edd5a928114c3144b18305b4df5ede06b4aa38a5dc91407cd10`. Full shown target SHA256: `c8fa4e3b382b0edd5a928114c3144b18305b4df5ede06b4aa38a5dc91407cd10`.

### Proposed decision

```json
{
  "claimId": "claim_78601f92423c2254f7933d514867ab69",
  "sourceUnitDigest": "9f3ce69e3eed5edfea59ac8e4d7bdbdeb861fd8f2f9aa73ba6289cfc347204c4",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "pointers-implementation",
  "targetUnitDigest": "9f3ce69e3eed5edfea59ac8e4d7bdbdeb861fd8f2f9aa73ba6289cfc347204c4",
  "targetAncestry": [
    "Spec: System Overview"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/specs/system-overview.md#pointers-implementation (lines 67–67) into docs/platform/system-overview/spec.md#pointers-implementation (lines 95–95), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## Pointers (implementation)

- `README.md` — mô tả sản phẩm + mục lục tài liệu
- `.agents/skills/distill/SKILL.md` — định nghĩa skill distill (Node zero-dep)
- `node .claude/skills/distill/scripts/distill.mjs check` — lệnh verify hiện hành (ghi tại `.bee/config.json`)
```

### Full target shown text

```text
## Pointers (implementation)

- `README.md` — mô tả sản phẩm + mục lục tài liệu
- `.agents/skills/distill/SKILL.md` — định nghĩa skill distill (Node zero-dep)
- `node .claude/skills/distill/scripts/distill.mjs check` — lệnh verify hiện hành (ghi tại `.bee/config.json`)
```

### Unified diff

```diff
No text difference.
```

## claim_4ef4508366ab954e848434aada74be54

Source: `docs/specs/system-overview.md#unheaded-block-15`. Target: `docs/platform/system-overview/spec.md#unheaded-block-18`.

Mechanical class: Unit-exact. Source digest: `97e5d9c3323668e0b451c079ce2555edba376d0c095da5b6567713d00e64a229`. Target digest: `97e5d9c3323668e0b451c079ce2555edba376d0c095da5b6567713d00e64a229`.

Full shown source SHA256: `97e5d9c3323668e0b451c079ce2555edba376d0c095da5b6567713d00e64a229`. Full shown target SHA256: `97e5d9c3323668e0b451c079ce2555edba376d0c095da5b6567713d00e64a229`.

### Proposed decision

```json
{
  "claimId": "claim_4ef4508366ab954e848434aada74be54",
  "sourceUnitDigest": "97e5d9c3323668e0b451c079ce2555edba376d0c095da5b6567713d00e64a229",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-18",
  "targetUnitDigest": "97e5d9c3323668e0b451c079ce2555edba376d0c095da5b6567713d00e64a229",
  "targetAncestry": [
    "Spec: System Overview",
    "Pointers (implementation)"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-15 (lines 69–71) into docs/platform/system-overview/spec.md#unheaded-block-18 (lines 97–99), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- `README.md` — mô tả sản phẩm + mục lục tài liệu
- `.agents/skills/distill/SKILL.md` — định nghĩa skill distill (Node zero-dep)
- `node .claude/skills/distill/scripts/distill.mjs check` — lệnh verify hiện hành (ghi tại `.bee/config.json`)
```

### Full target shown text

```text
- `README.md` — mô tả sản phẩm + mục lục tài liệu
- `.agents/skills/distill/SKILL.md` — định nghĩa skill distill (Node zero-dep)
- `node .claude/skills/distill/scripts/distill.mjs check` — lệnh verify hiện hành (ghi tại `.bee/config.json`)
```

### Unified diff

```diff
No text difference.
```

## claim_42cce1eacf244132db046ecf3733c4fb

Source: `docs/specs/system-overview.md#lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4`. Target: `docs/platform/system-overview/spec.md#lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4`.

Mechanical class: Unit-exact. Source digest: `0e00c9cccba1af1ea5926f1106dd72d535b230294281707303ecd16fbc0a2bea`. Target digest: `0e00c9cccba1af1ea5926f1106dd72d535b230294281707303ecd16fbc0a2bea`.

Full shown source SHA256: `b1c96a6b7e91c0b817366eff6749df6f0fbffa6b9e669f3a13b57fd96eb51b36`. Full shown target SHA256: `b1c96a6b7e91c0b817366eff6749df6f0fbffa6b9e669f3a13b57fd96eb51b36`.

### Proposed decision

```json
{
  "claimId": "claim_42cce1eacf244132db046ecf3733c4fb",
  "sourceUnitDigest": "0e00c9cccba1af1ea5926f1106dd72d535b230294281707303ecd16fbc0a2bea",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4",
  "targetUnitDigest": "0e00c9cccba1af1ea5926f1106dd72d535b230294281707303ecd16fbc0a2bea",
  "targetAncestry": [
    "Spec: System Overview"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete heading at docs/specs/system-overview.md#lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4 (lines 73–73) into docs/platform/system-overview/spec.md#lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4 (lines 101–101), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Retired decision narrative remains explicitly dated provenance within its area owner, not fresh current truth. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)

Các ADR dưới đây được di dời nguyên văn từ `docs/decisions/` (tsk-1lv-4) -- corpus đó đã retired, `state.decisions` (qua `fgos decision --scope`) giữ record ngắn làm nguồn thật, phần narrative đầy đủ sống ở đây. Thứ tự theo số ADR gốc.
```

### Full target shown text

```text
## Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)

Các ADR dưới đây được di dời nguyên văn từ `docs/decisions/` (tsk-1lv-4) -- corpus đó đã retired, `state.decisions` (qua `fgos decision --scope`) giữ record ngắn làm nguồn thật, phần narrative đầy đủ sống ở đây. Thứ tự theo số ADR gốc.
```

### Unified diff

```diff
No text difference.
```

## claim_1aa589b82c1b4ebf922a2ff495921ff9

Source: `docs/specs/system-overview.md#unheaded-block-16`. Target: `docs/platform/system-overview/spec.md#unheaded-block-19`.

Mechanical class: Unit-exact. Source digest: `ac2b043c0d4f9fde1e7ecee60609cbe700480b9dd33105f98d30f6c6057ffb5c`. Target digest: `ac2b043c0d4f9fde1e7ecee60609cbe700480b9dd33105f98d30f6c6057ffb5c`.

Full shown source SHA256: `ac2b043c0d4f9fde1e7ecee60609cbe700480b9dd33105f98d30f6c6057ffb5c`. Full shown target SHA256: `ac2b043c0d4f9fde1e7ecee60609cbe700480b9dd33105f98d30f6c6057ffb5c`.

### Proposed decision

```json
{
  "claimId": "claim_1aa589b82c1b4ebf922a2ff495921ff9",
  "sourceUnitDigest": "ac2b043c0d4f9fde1e7ecee60609cbe700480b9dd33105f98d30f6c6057ffb5c",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-19",
  "targetUnitDigest": "ac2b043c0d4f9fde1e7ecee60609cbe700480b9dd33105f98d30f6c6057ffb5c",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-16 (lines 75–75) into docs/platform/system-overview/spec.md#unheaded-block-19 (lines 103–103), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Các ADR dưới đây được di dời nguyên văn từ `docs/decisions/` (tsk-1lv-4) -- corpus đó đã retired, `state.decisions` (qua `fgos decision --scope`) giữ record ngắn làm nguồn thật, phần narrative đầy đủ sống ở đây. Thứ tự theo số ADR gốc.
```

### Full target shown text

```text
Các ADR dưới đây được di dời nguyên văn từ `docs/decisions/` (tsk-1lv-4) -- corpus đó đã retired, `state.decisions` (qua `fgos decision --scope`) giữ record ngắn làm nguồn thật, phần narrative đầy đủ sống ở đây. Thứ tự theo số ADR gốc.
```

### Unified diff

```diff
No text difference.
```

## claim_0f245239bb5260184a5e148679ec996a

Source: `docs/specs/system-overview.md#0016-mốc-mvp-của-fgos`. Target: `docs/platform/system-overview/spec.md#0016-mốc-mvp-của-fgos`.

Mechanical class: Weak-exact. Source digest: `f977c7a5cb812938ec71e42548c6358a719589327f3ff618a792b15e56f85811`. Target digest: `f977c7a5cb812938ec71e42548c6358a719589327f3ff618a792b15e56f85811`.

Full shown source SHA256: `0323bd3a7792050ea91cbf962fc7cfe8f74799860c7c2173b4c999489a53df3d`. Full shown target SHA256: `0323bd3a7792050ea91cbf962fc7cfe8f74799860c7c2173b4c999489a53df3d`.

### Proposed decision

```json
{
  "claimId": "claim_0f245239bb5260184a5e148679ec996a",
  "sourceUnitDigest": "f977c7a5cb812938ec71e42548c6358a719589327f3ff618a792b15e56f85811",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "0016-mốc-mvp-của-fgos",
  "targetUnitDigest": "f977c7a5cb812938ec71e42548c6358a719589327f3ff618a792b15e56f85811",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/specs/system-overview.md#0016-mốc-mvp-của-fgos (lines 78–78) into docs/platform/system-overview/spec.md#0016-mốc-mvp-của-fgos (lines 106–106), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
### 0016 — Mốc MVP của fgOS
```

### Full target shown text

```text
### 0016 — Mốc MVP của fgOS
```

### Unified diff

```diff
No text difference.
```

## claim_8f901d4d4ac134d127e5a9905ac5ffc7

Source: `docs/specs/system-overview.md#bối-cảnh`. Target: `docs/platform/system-overview/spec.md#bối-cảnh`.

Mechanical class: Weak-exact. Source digest: `180af535ab0ff1f36452842ec46cea3a86bc6d19500e8663f0e54b4fad2a0bb4`. Target digest: `180af535ab0ff1f36452842ec46cea3a86bc6d19500e8663f0e54b4fad2a0bb4`.

Full shown source SHA256: `0f483e563070b9782c144034d07377fe340aed71415baa9610785d23debaa11a`. Full shown target SHA256: `0f483e563070b9782c144034d07377fe340aed71415baa9610785d23debaa11a`.

### Proposed decision

```json
{
  "claimId": "claim_8f901d4d4ac134d127e5a9905ac5ffc7",
  "sourceUnitDigest": "180af535ab0ff1f36452842ec46cea3a86bc6d19500e8663f0e54b4fad2a0bb4",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "bối-cảnh",
  "targetUnitDigest": "180af535ab0ff1f36452842ec46cea3a86bc6d19500e8663f0e54b4fad2a0bb4",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0016 — Mốc MVP của fgOS"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/specs/system-overview.md#bối-cảnh (lines 80–80) into docs/platform/system-overview/spec.md#bối-cảnh (lines 108–108), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
#### Bối cảnh

Trước quyết định này fgOS chưa có phát biểu MVP/milestone chính thức nào — grep "MVP"/"milestone" trong `docs/` trả 0 hit. Định nghĩa "có harness" ở `platform-foundations.md` L5 (sáu câu hỏi) và thang trưởng thành hạ tầng L6 (F0–F5, fgOS tự tuyên F4 tại 2026-07-16) đo ĐỘ CHÍN CỦA HẠ TẦNG, không đo "người dùng cuối LÀM ĐƯỢC GÌ". Một câu MVP nháp xuất hiện trong báo cáo tích hợp P50 (2026-07-20) nhưng gắn nhãn "chưa chốt" và chỉ sống trong một file HTML report — không phải tài liệu sản phẩm đã ship.

Mốc dogfood tự-phát-triển (STR25) đã ĐẠT 2026-07-17: item thật đi trọn vòng submit→clarify→decompose→execute→PR→merge, không cần bee đỡ. Nghĩa là VÒNG cốt lõi đã chạy; cái còn thiếu để thành "sản phẩm cho người lạ" là hai điều trong chính câu MVP: người-mới-chỉ-dùng-tài-liệu-đã-ship, và tối-thiểu-ngồi-canh.
```

### Full target shown text

```text
#### Bối cảnh

Trước quyết định này fgOS chưa có phát biểu MVP/milestone chính thức nào — grep "MVP"/"milestone" trong `docs/` trả 0 hit. Định nghĩa "có harness" ở `platform-foundations.md` L5 (sáu câu hỏi) và thang trưởng thành hạ tầng L6 (F0–F5, fgOS tự tuyên F4 tại 2026-07-16) đo ĐỘ CHÍN CỦA HẠ TẦNG, không đo "người dùng cuối LÀM ĐƯỢC GÌ". Một câu MVP nháp xuất hiện trong báo cáo tích hợp P50 (2026-07-20) nhưng gắn nhãn "chưa chốt" và chỉ sống trong một file HTML report — không phải tài liệu sản phẩm đã ship.

Mốc dogfood tự-phát-triển (STR25) đã ĐẠT 2026-07-17: item thật đi trọn vòng submit→clarify→decompose→execute→PR→merge, không cần bee đỡ. Nghĩa là VÒNG cốt lõi đã chạy; cái còn thiếu để thành "sản phẩm cho người lạ" là hai điều trong chính câu MVP: người-mới-chỉ-dùng-tài-liệu-đã-ship, và tối-thiểu-ngồi-canh.
```

### Unified diff

```diff
No text difference.
```

## claim_43e475db44152c0b754f44162aa2a0f6

Source: `docs/specs/system-overview.md#unheaded-block-17`. Target: `docs/platform/system-overview/spec.md#unheaded-block-20`.

Mechanical class: Unit-exact. Source digest: `035f26d192b740ad51442be5915a92eba9b9f63a5440cf86b20bc8806fb2f457`. Target digest: `035f26d192b740ad51442be5915a92eba9b9f63a5440cf86b20bc8806fb2f457`.

Full shown source SHA256: `035f26d192b740ad51442be5915a92eba9b9f63a5440cf86b20bc8806fb2f457`. Full shown target SHA256: `035f26d192b740ad51442be5915a92eba9b9f63a5440cf86b20bc8806fb2f457`.

### Proposed decision

```json
{
  "claimId": "claim_43e475db44152c0b754f44162aa2a0f6",
  "sourceUnitDigest": "035f26d192b740ad51442be5915a92eba9b9f63a5440cf86b20bc8806fb2f457",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-20",
  "targetUnitDigest": "035f26d192b740ad51442be5915a92eba9b9f63a5440cf86b20bc8806fb2f457",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0016 — Mốc MVP của fgOS",
    "Bối cảnh"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-17 (lines 82–82) into docs/platform/system-overview/spec.md#unheaded-block-20 (lines 110–110), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Trước quyết định này fgOS chưa có phát biểu MVP/milestone chính thức nào — grep "MVP"/"milestone" trong `docs/` trả 0 hit. Định nghĩa "có harness" ở `platform-foundations.md` L5 (sáu câu hỏi) và thang trưởng thành hạ tầng L6 (F0–F5, fgOS tự tuyên F4 tại 2026-07-16) đo ĐỘ CHÍN CỦA HẠ TẦNG, không đo "người dùng cuối LÀM ĐƯỢC GÌ". Một câu MVP nháp xuất hiện trong báo cáo tích hợp P50 (2026-07-20) nhưng gắn nhãn "chưa chốt" và chỉ sống trong một file HTML report — không phải tài liệu sản phẩm đã ship.
```

### Full target shown text

```text
Trước quyết định này fgOS chưa có phát biểu MVP/milestone chính thức nào — grep "MVP"/"milestone" trong `docs/` trả 0 hit. Định nghĩa "có harness" ở `platform-foundations.md` L5 (sáu câu hỏi) và thang trưởng thành hạ tầng L6 (F0–F5, fgOS tự tuyên F4 tại 2026-07-16) đo ĐỘ CHÍN CỦA HẠ TẦNG, không đo "người dùng cuối LÀM ĐƯỢC GÌ". Một câu MVP nháp xuất hiện trong báo cáo tích hợp P50 (2026-07-20) nhưng gắn nhãn "chưa chốt" và chỉ sống trong một file HTML report — không phải tài liệu sản phẩm đã ship.
```

### Unified diff

```diff
No text difference.
```

## claim_89ed9f05d388264bd92abad1e3355979

Source: `docs/specs/system-overview.md#unheaded-block-18`. Target: `docs/platform/system-overview/spec.md#unheaded-block-21`.

Mechanical class: Unit-exact. Source digest: `7a2a6fe7aacb92898bf7860528039bf35a7ca76fb22b0ea540ccc820d3c073fb`. Target digest: `7a2a6fe7aacb92898bf7860528039bf35a7ca76fb22b0ea540ccc820d3c073fb`.

Full shown source SHA256: `7a2a6fe7aacb92898bf7860528039bf35a7ca76fb22b0ea540ccc820d3c073fb`. Full shown target SHA256: `7a2a6fe7aacb92898bf7860528039bf35a7ca76fb22b0ea540ccc820d3c073fb`.

### Proposed decision

```json
{
  "claimId": "claim_89ed9f05d388264bd92abad1e3355979",
  "sourceUnitDigest": "7a2a6fe7aacb92898bf7860528039bf35a7ca76fb22b0ea540ccc820d3c073fb",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-21",
  "targetUnitDigest": "7a2a6fe7aacb92898bf7860528039bf35a7ca76fb22b0ea540ccc820d3c073fb",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0016 — Mốc MVP của fgOS",
    "Bối cảnh"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-18 (lines 84–84) into docs/platform/system-overview/spec.md#unheaded-block-21 (lines 112–112), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Mốc dogfood tự-phát-triển (STR25) đã ĐẠT 2026-07-17: item thật đi trọn vòng submit→clarify→decompose→execute→PR→merge, không cần bee đỡ. Nghĩa là VÒNG cốt lõi đã chạy; cái còn thiếu để thành "sản phẩm cho người lạ" là hai điều trong chính câu MVP: người-mới-chỉ-dùng-tài-liệu-đã-ship, và tối-thiểu-ngồi-canh.
```

### Full target shown text

```text
Mốc dogfood tự-phát-triển (STR25) đã ĐẠT 2026-07-17: item thật đi trọn vòng submit→clarify→decompose→execute→PR→merge, không cần bee đỡ. Nghĩa là VÒNG cốt lõi đã chạy; cái còn thiếu để thành "sản phẩm cho người lạ" là hai điều trong chính câu MVP: người-mới-chỉ-dùng-tài-liệu-đã-ship, và tối-thiểu-ngồi-canh.
```

### Unified diff

```diff
No text difference.
```

## claim_bff1d7e2832372efef32e3f68a827ae1

Source: `docs/specs/system-overview.md#quyết-định`. Target: `docs/platform/system-overview/spec.md#quyết-định`.

Mechanical class: Weak-exact. Source digest: `ecce4cc8c0219563f30d06a59a921ca306d123cb3c63d9448cc58a92d7598bae`. Target digest: `ecce4cc8c0219563f30d06a59a921ca306d123cb3c63d9448cc58a92d7598bae`.

Full shown source SHA256: `4478046af3937538dffd68a6c4cad34c8d2c49aaf990b405c6e7b90abc9640d2`. Full shown target SHA256: `4478046af3937538dffd68a6c4cad34c8d2c49aaf990b405c6e7b90abc9640d2`.

### Proposed decision

```json
{
  "claimId": "claim_bff1d7e2832372efef32e3f68a827ae1",
  "sourceUnitDigest": "ecce4cc8c0219563f30d06a59a921ca306d123cb3c63d9448cc58a92d7598bae",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "quyết-định",
  "targetUnitDigest": "ecce4cc8c0219563f30d06a59a921ca306d123cb3c63d9448cc58a92d7598bae",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0016 — Mốc MVP của fgOS"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/specs/system-overview.md#quyết-định (lines 86–86) into docs/platform/system-overview/spec.md#quyết-định (lines 114–114), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
#### Quyết định

1. **Phát biểu MVP của fgOS (chốt):**

   > Một người mới — không có ngữ cảnh trước, chỉ dựa vào tài liệu ĐÃ SHIP — cài fgOS, nộp MỘT yêu cầu thật bằng văn xuôi tự do, và nhận lại một thay đổi code thật: chạy được, có test, sẵn sàng merge — với tối thiểu sự canh chừng của con người.

2. **"Tối thiểu ngồi canh" có răng đo được:** con người chỉ can thiệp ở các CỔNG-NGƯỜI thật sự cần một quyết định (clarify không hội tụ được vì thiếu thông tin chỉ người có; duyệt/merge). Con người KHÔNG phải can thiệp để gỡ hệ tự-kẹt (park oan, loop lỗi, phán đoán lồng-nhau hỏng). Một lần bắt người gỡ-kẹt là một lỗi tính vào MVP, không phải một cổng-người hợp lệ.

3. **Trục MVP bổ sung cho L5/L6, không thay thế:** L5 (định nghĩa "có harness") và L6 (thang chín hạ tầng) đo phía HỆ; câu MVP này đo phía NGƯỜI DÙNG CUỐI. Ba trục cùng tồn tại, không trùng.

4. **Phạm vi MVP là "một yêu cầu → một code change".** Nó KHÔNG đòi goal-directed planning (khai goal → tự sắp cả backlog, STR67) — đó là tính năng lớn hơn, mở rộng CƠ HỘI vượt MVP tối thiểu, không phải điều kiện của MVP.
```

### Full target shown text

```text
#### Quyết định

1. **Phát biểu MVP của fgOS (chốt):**

   > Một người mới — không có ngữ cảnh trước, chỉ dựa vào tài liệu ĐÃ SHIP — cài fgOS, nộp MỘT yêu cầu thật bằng văn xuôi tự do, và nhận lại một thay đổi code thật: chạy được, có test, sẵn sàng merge — với tối thiểu sự canh chừng của con người.

2. **"Tối thiểu ngồi canh" có răng đo được:** con người chỉ can thiệp ở các CỔNG-NGƯỜI thật sự cần một quyết định (clarify không hội tụ được vì thiếu thông tin chỉ người có; duyệt/merge). Con người KHÔNG phải can thiệp để gỡ hệ tự-kẹt (park oan, loop lỗi, phán đoán lồng-nhau hỏng). Một lần bắt người gỡ-kẹt là một lỗi tính vào MVP, không phải một cổng-người hợp lệ.

3. **Trục MVP bổ sung cho L5/L6, không thay thế:** L5 (định nghĩa "có harness") và L6 (thang chín hạ tầng) đo phía HỆ; câu MVP này đo phía NGƯỜI DÙNG CUỐI. Ba trục cùng tồn tại, không trùng.

4. **Phạm vi MVP là "một yêu cầu → một code change".** Nó KHÔNG đòi goal-directed planning (khai goal → tự sắp cả backlog, STR67) — đó là tính năng lớn hơn, mở rộng CƠ HỘI vượt MVP tối thiểu, không phải điều kiện của MVP.
```

### Unified diff

```diff
No text difference.
```

## claim_773abd396e5651c883d24ae9154e5abe

Source: `docs/specs/system-overview.md#unheaded-block-19`. Target: `docs/platform/system-overview/spec.md#unheaded-block-22`.

Mechanical class: Weak-exact. Source digest: `86470363f8975826cef49be51ee068b76dfd3e1709fa1a009d308aaf648d0e9f`. Target digest: `86470363f8975826cef49be51ee068b76dfd3e1709fa1a009d308aaf648d0e9f`.

Full shown source SHA256: `86470363f8975826cef49be51ee068b76dfd3e1709fa1a009d308aaf648d0e9f`. Full shown target SHA256: `86470363f8975826cef49be51ee068b76dfd3e1709fa1a009d308aaf648d0e9f`.

### Proposed decision

```json
{
  "claimId": "claim_773abd396e5651c883d24ae9154e5abe",
  "sourceUnitDigest": "86470363f8975826cef49be51ee068b76dfd3e1709fa1a009d308aaf648d0e9f",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-22",
  "targetUnitDigest": "86470363f8975826cef49be51ee068b76dfd3e1709fa1a009d308aaf648d0e9f",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0016 — Mốc MVP của fgOS",
    "Quyết định"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-19 (lines 88–88) into docs/platform/system-overview/spec.md#unheaded-block-22 (lines 116–116), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
1. **Phát biểu MVP của fgOS (chốt):**
```

### Full target shown text

```text
1. **Phát biểu MVP của fgOS (chốt):**
```

### Unified diff

```diff
No text difference.
```

## claim_96a67ee0d47a31057e1b144c6477181d

Source: `docs/specs/system-overview.md#unheaded-block-20`. Target: `docs/platform/system-overview/spec.md#unheaded-block-23`.

Mechanical class: Unit-exact. Source digest: `a956941f710ace090d5a068b66bda1656e6315d916cff6fd853e74e6fe8499b8`. Target digest: `a956941f710ace090d5a068b66bda1656e6315d916cff6fd853e74e6fe8499b8`.

Full shown source SHA256: `a956941f710ace090d5a068b66bda1656e6315d916cff6fd853e74e6fe8499b8`. Full shown target SHA256: `a956941f710ace090d5a068b66bda1656e6315d916cff6fd853e74e6fe8499b8`.

### Proposed decision

```json
{
  "claimId": "claim_96a67ee0d47a31057e1b144c6477181d",
  "sourceUnitDigest": "a956941f710ace090d5a068b66bda1656e6315d916cff6fd853e74e6fe8499b8",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-23",
  "targetUnitDigest": "a956941f710ace090d5a068b66bda1656e6315d916cff6fd853e74e6fe8499b8",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0016 — Mốc MVP của fgOS",
    "Quyết định"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-20 (lines 90–90) into docs/platform/system-overview/spec.md#unheaded-block-23 (lines 118–118), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
> Một người mới — không có ngữ cảnh trước, chỉ dựa vào tài liệu ĐÃ SHIP — cài fgOS, nộp MỘT yêu cầu thật bằng văn xuôi tự do, và nhận lại một thay đổi code thật: chạy được, có test, sẵn sàng merge — với tối thiểu sự canh chừng của con người.
```

### Full target shown text

```text
> Một người mới — không có ngữ cảnh trước, chỉ dựa vào tài liệu ĐÃ SHIP — cài fgOS, nộp MỘT yêu cầu thật bằng văn xuôi tự do, và nhận lại một thay đổi code thật: chạy được, có test, sẵn sàng merge — với tối thiểu sự canh chừng của con người.
```

### Unified diff

```diff
No text difference.
```

## claim_3029f7796e1bf331654e2da374cf20aa

Source: `docs/specs/system-overview.md#unheaded-block-21`. Target: `docs/platform/system-overview/spec.md#unheaded-block-24`.

Mechanical class: Unit-exact. Source digest: `af929a9783b1b814da80d6e90013059ccc535aefa9001480f4b4fd7d5b8fae0c`. Target digest: `af929a9783b1b814da80d6e90013059ccc535aefa9001480f4b4fd7d5b8fae0c`.

Full shown source SHA256: `af929a9783b1b814da80d6e90013059ccc535aefa9001480f4b4fd7d5b8fae0c`. Full shown target SHA256: `af929a9783b1b814da80d6e90013059ccc535aefa9001480f4b4fd7d5b8fae0c`.

### Proposed decision

```json
{
  "claimId": "claim_3029f7796e1bf331654e2da374cf20aa",
  "sourceUnitDigest": "af929a9783b1b814da80d6e90013059ccc535aefa9001480f4b4fd7d5b8fae0c",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-24",
  "targetUnitDigest": "af929a9783b1b814da80d6e90013059ccc535aefa9001480f4b4fd7d5b8fae0c",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0016 — Mốc MVP của fgOS",
    "Quyết định"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-21 (lines 92–92) into docs/platform/system-overview/spec.md#unheaded-block-24 (lines 120–120), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
2. **"Tối thiểu ngồi canh" có răng đo được:** con người chỉ can thiệp ở các CỔNG-NGƯỜI thật sự cần một quyết định (clarify không hội tụ được vì thiếu thông tin chỉ người có; duyệt/merge). Con người KHÔNG phải can thiệp để gỡ hệ tự-kẹt (park oan, loop lỗi, phán đoán lồng-nhau hỏng). Một lần bắt người gỡ-kẹt là một lỗi tính vào MVP, không phải một cổng-người hợp lệ.
```

### Full target shown text

```text
2. **"Tối thiểu ngồi canh" có răng đo được:** con người chỉ can thiệp ở các CỔNG-NGƯỜI thật sự cần một quyết định (clarify không hội tụ được vì thiếu thông tin chỉ người có; duyệt/merge). Con người KHÔNG phải can thiệp để gỡ hệ tự-kẹt (park oan, loop lỗi, phán đoán lồng-nhau hỏng). Một lần bắt người gỡ-kẹt là một lỗi tính vào MVP, không phải một cổng-người hợp lệ.
```

### Unified diff

```diff
No text difference.
```

## claim_d87933045c2bc9f7a7bc58ab78a1d6ce

Source: `docs/specs/system-overview.md#unheaded-block-22`. Target: `docs/platform/system-overview/spec.md#unheaded-block-25`.

Mechanical class: Unit-exact. Source digest: `640e74dd79d88c3be8fab531f6354a62a51d2f1bce7646d753ccbe7db46fea23`. Target digest: `640e74dd79d88c3be8fab531f6354a62a51d2f1bce7646d753ccbe7db46fea23`.

Full shown source SHA256: `640e74dd79d88c3be8fab531f6354a62a51d2f1bce7646d753ccbe7db46fea23`. Full shown target SHA256: `640e74dd79d88c3be8fab531f6354a62a51d2f1bce7646d753ccbe7db46fea23`.

### Proposed decision

```json
{
  "claimId": "claim_d87933045c2bc9f7a7bc58ab78a1d6ce",
  "sourceUnitDigest": "640e74dd79d88c3be8fab531f6354a62a51d2f1bce7646d753ccbe7db46fea23",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-25",
  "targetUnitDigest": "640e74dd79d88c3be8fab531f6354a62a51d2f1bce7646d753ccbe7db46fea23",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0016 — Mốc MVP của fgOS",
    "Quyết định"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-22 (lines 94–94) into docs/platform/system-overview/spec.md#unheaded-block-25 (lines 122–122), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
3. **Trục MVP bổ sung cho L5/L6, không thay thế:** L5 (định nghĩa "có harness") và L6 (thang chín hạ tầng) đo phía HỆ; câu MVP này đo phía NGƯỜI DÙNG CUỐI. Ba trục cùng tồn tại, không trùng.
```

### Full target shown text

```text
3. **Trục MVP bổ sung cho L5/L6, không thay thế:** L5 (định nghĩa "có harness") và L6 (thang chín hạ tầng) đo phía HỆ; câu MVP này đo phía NGƯỜI DÙNG CUỐI. Ba trục cùng tồn tại, không trùng.
```

### Unified diff

```diff
No text difference.
```

## claim_db1b842cf504bb28a060deb21e04aebf

Source: `docs/specs/system-overview.md#unheaded-block-23`. Target: `docs/platform/system-overview/spec.md#unheaded-block-26`.

Mechanical class: Unit-exact. Source digest: `ca1e25e3422164d7a0c32774fd017bf4b37338681688fb71e843053c0e582a96`. Target digest: `ca1e25e3422164d7a0c32774fd017bf4b37338681688fb71e843053c0e582a96`.

Full shown source SHA256: `ca1e25e3422164d7a0c32774fd017bf4b37338681688fb71e843053c0e582a96`. Full shown target SHA256: `ca1e25e3422164d7a0c32774fd017bf4b37338681688fb71e843053c0e582a96`.

### Proposed decision

```json
{
  "claimId": "claim_db1b842cf504bb28a060deb21e04aebf",
  "sourceUnitDigest": "ca1e25e3422164d7a0c32774fd017bf4b37338681688fb71e843053c0e582a96",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-26",
  "targetUnitDigest": "ca1e25e3422164d7a0c32774fd017bf4b37338681688fb71e843053c0e582a96",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0016 — Mốc MVP của fgOS",
    "Quyết định"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-23 (lines 96–96) into docs/platform/system-overview/spec.md#unheaded-block-26 (lines 124–124), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
4. **Phạm vi MVP là "một yêu cầu → một code change".** Nó KHÔNG đòi goal-directed planning (khai goal → tự sắp cả backlog, STR67) — đó là tính năng lớn hơn, mở rộng CƠ HỘI vượt MVP tối thiểu, không phải điều kiện của MVP.
```

### Full target shown text

```text
4. **Phạm vi MVP là "một yêu cầu → một code change".** Nó KHÔNG đòi goal-directed planning (khai goal → tự sắp cả backlog, STR67) — đó là tính năng lớn hơn, mở rộng CƠ HỘI vượt MVP tối thiểu, không phải điều kiện của MVP.
```

### Unified diff

```diff
No text difference.
```

## claim_0d18c2fd9e915d8bd06f6cea7ba1c931

Source: `docs/specs/system-overview.md#hệ-quả`. Target: `docs/platform/system-overview/spec.md#hệ-quả`.

Mechanical class: Weak-exact. Source digest: `a98b8477e2daa3ef863b480bf2f9845a1e0ad34217de4189adde5f8ece5ffd27`. Target digest: `a98b8477e2daa3ef863b480bf2f9845a1e0ad34217de4189adde5f8ece5ffd27`.

Full shown source SHA256: `d16f4f3391c8689d0d711e86411fe61485f4584042f4c80820003ff7d5d748ea`. Full shown target SHA256: `d16f4f3391c8689d0d711e86411fe61485f4584042f4c80820003ff7d5d748ea`.

### Proposed decision

```json
{
  "claimId": "claim_0d18c2fd9e915d8bd06f6cea7ba1c931",
  "sourceUnitDigest": "a98b8477e2daa3ef863b480bf2f9845a1e0ad34217de4189adde5f8ece5ffd27",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "hệ-quả",
  "targetUnitDigest": "a98b8477e2daa3ef863b480bf2f9845a1e0ad34217de4189adde5f8ece5ffd27",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0016 — Mốc MVP của fgOS"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/specs/system-overview.md#hệ-quả (lines 98–98) into docs/platform/system-overview/spec.md#hệ-quả (lines 126–126), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
#### Hệ quả

- **Ưu tiên hướng MVP** (dẫn ra từ phát biểu này): (a) độ tin cậy của loop tự chạy — mọi "gỡ-kẹt-thủ-công" là bug MVP (ví dụ STR68: phán đoán discovery lồng-nhau trả văn xuôi thay vì JSON → park oan item rõ ràng, vi phạm trực tiếp "tối thiểu ngồi canh"); (b) chất lượng tài liệu ĐÃ SHIP đủ cho người lạ (STR64); (c) trải nghiệm cổng-người khi loop THẬT SỰ cần người (STR61 đã ship; STR69/STR70 là enabler).
- **STR67 (goal-directed planning)** dùng chính câu MVP này làm target đầu vào cho ca dogfood đầu tiên của nó — nhưng nằm NGOÀI phạm vi MVP tối thiểu (điểm 4).
- **Không supersede gì** — thêm một trục mục tiêu sản phẩm mới, không đổi luật L1–L10.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target shown text

```text
#### Hệ quả

- **Ưu tiên hướng MVP** (dẫn ra từ phát biểu này): (a) độ tin cậy của loop tự chạy — mọi "gỡ-kẹt-thủ-công" là bug MVP (ví dụ STR68: phán đoán discovery lồng-nhau trả văn xuôi thay vì JSON → park oan item rõ ràng, vi phạm trực tiếp "tối thiểu ngồi canh"); (b) chất lượng tài liệu ĐÃ SHIP đủ cho người lạ (STR64); (c) trải nghiệm cổng-người khi loop THẬT SỰ cần người (STR61 đã ship; STR69/STR70 là enabler).
- **STR67 (goal-directed planning)** dùng chính câu MVP này làm target đầu vào cho ca dogfood đầu tiên của nó — nhưng nằm NGOÀI phạm vi MVP tối thiểu (điểm 4).
- **Không supersede gì** — thêm một trục mục tiêu sản phẩm mới, không đổi luật L1–L10.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Unified diff

```diff
No text difference.
```

## claim_f83b3ea625df88ebe183978cbc7c8c93

Source: `docs/specs/system-overview.md#unheaded-block-24`. Target: `docs/platform/system-overview/spec.md#unheaded-block-27`.

Mechanical class: Unit-exact. Source digest: `37be99be5616526202bcb7092e29f3bb49d0605fb0a34d883dee60932671667d`. Target digest: `37be99be5616526202bcb7092e29f3bb49d0605fb0a34d883dee60932671667d`.

Full shown source SHA256: `37be99be5616526202bcb7092e29f3bb49d0605fb0a34d883dee60932671667d`. Full shown target SHA256: `37be99be5616526202bcb7092e29f3bb49d0605fb0a34d883dee60932671667d`.

### Proposed decision

```json
{
  "claimId": "claim_f83b3ea625df88ebe183978cbc7c8c93",
  "sourceUnitDigest": "37be99be5616526202bcb7092e29f3bb49d0605fb0a34d883dee60932671667d",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-27",
  "targetUnitDigest": "37be99be5616526202bcb7092e29f3bb49d0605fb0a34d883dee60932671667d",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0016 — Mốc MVP của fgOS",
    "Hệ quả"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-24 (lines 100–102) into docs/platform/system-overview/spec.md#unheaded-block-27 (lines 128–130), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- **Ưu tiên hướng MVP** (dẫn ra từ phát biểu này): (a) độ tin cậy của loop tự chạy — mọi "gỡ-kẹt-thủ-công" là bug MVP (ví dụ STR68: phán đoán discovery lồng-nhau trả văn xuôi thay vì JSON → park oan item rõ ràng, vi phạm trực tiếp "tối thiểu ngồi canh"); (b) chất lượng tài liệu ĐÃ SHIP đủ cho người lạ (STR64); (c) trải nghiệm cổng-người khi loop THẬT SỰ cần người (STR61 đã ship; STR69/STR70 là enabler).
- **STR67 (goal-directed planning)** dùng chính câu MVP này làm target đầu vào cho ca dogfood đầu tiên của nó — nhưng nằm NGOÀI phạm vi MVP tối thiểu (điểm 4).
- **Không supersede gì** — thêm một trục mục tiêu sản phẩm mới, không đổi luật L1–L10.
```

### Full target shown text

```text
- **Ưu tiên hướng MVP** (dẫn ra từ phát biểu này): (a) độ tin cậy của loop tự chạy — mọi "gỡ-kẹt-thủ-công" là bug MVP (ví dụ STR68: phán đoán discovery lồng-nhau trả văn xuôi thay vì JSON → park oan item rõ ràng, vi phạm trực tiếp "tối thiểu ngồi canh"); (b) chất lượng tài liệu ĐÃ SHIP đủ cho người lạ (STR64); (c) trải nghiệm cổng-người khi loop THẬT SỰ cần người (STR61 đã ship; STR69/STR70 là enabler).
- **STR67 (goal-directed planning)** dùng chính câu MVP này làm target đầu vào cho ca dogfood đầu tiên của nó — nhưng nằm NGOÀI phạm vi MVP tối thiểu (điểm 4).
- **Không supersede gì** — thêm một trục mục tiêu sản phẩm mới, không đổi luật L1–L10.
```

### Unified diff

```diff
No text difference.
```

## claim_e4b03884bb0c50d641f173b8a74c6501

Source: `docs/specs/system-overview.md#unheaded-block-25`. Target: `docs/platform/system-overview/spec.md#unheaded-block-28`.

Mechanical class: Weak-exact. Source digest: `95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104`. Target digest: `95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104`.

Full shown source SHA256: `95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104`. Full shown target SHA256: `95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104`.

### Proposed decision

```json
{
  "claimId": "claim_e4b03884bb0c50d641f173b8a74c6501",
  "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-28",
  "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0016 — Mốc MVP của fgOS",
    "Hệ quả"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: target digest repeats. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-25 (lines 104–104) into docs/platform/system-overview/spec.md#unheaded-block-28 (lines 132–132), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
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

## claim_50ab78f3abdd6c80ec1b7b237ca9d20e

Source: `docs/specs/system-overview.md#0018-mốc-mvp2-của-fgos`. Target: `docs/platform/system-overview/spec.md#0018-mốc-mvp2-của-fgos`.

Mechanical class: Weak-exact. Source digest: `e77b84b8020b24b4201a75f807f8aa001a904378d02b6b601bba14c0ee0a3097`. Target digest: `e77b84b8020b24b4201a75f807f8aa001a904378d02b6b601bba14c0ee0a3097`.

Full shown source SHA256: `e741dd4f008001cfe12bcacf86fe1466bec46cf4495498931bfa3eb23da4579e`. Full shown target SHA256: `e741dd4f008001cfe12bcacf86fe1466bec46cf4495498931bfa3eb23da4579e`.

### Proposed decision

```json
{
  "claimId": "claim_50ab78f3abdd6c80ec1b7b237ca9d20e",
  "sourceUnitDigest": "e77b84b8020b24b4201a75f807f8aa001a904378d02b6b601bba14c0ee0a3097",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "0018-mốc-mvp2-của-fgos",
  "targetUnitDigest": "e77b84b8020b24b4201a75f807f8aa001a904378d02b6b601bba14c0ee0a3097",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/specs/system-overview.md#0018-mốc-mvp2-của-fgos (lines 106–106) into docs/platform/system-overview/spec.md#0018-mốc-mvp2-của-fgos (lines 134–134), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
### 0018 — Mốc MVP2 của fgOS
```

### Full target shown text

```text
### 0018 — Mốc MVP2 của fgOS
```

### Unified diff

```diff
No text difference.
```

## claim_b6f4e923882b1843ebe993ffd9d05369

Source: `docs/specs/system-overview.md#bối-cảnh-1`. Target: `docs/platform/system-overview/spec.md#bối-cảnh-1`.

Mechanical class: Weak-exact. Source digest: `96a78de23befc0537f1e29d65e9fc09bdc559b0a335bb077ab5d950a3d644516`. Target digest: `96a78de23befc0537f1e29d65e9fc09bdc559b0a335bb077ab5d950a3d644516`.

Full shown source SHA256: `48cde44ed233c48e8f15d6304e8a4b5dbe9dae2338fb3e4908cebf842c507f58`. Full shown target SHA256: `48cde44ed233c48e8f15d6304e8a4b5dbe9dae2338fb3e4908cebf842c507f58`.

### Proposed decision

```json
{
  "claimId": "claim_b6f4e923882b1843ebe993ffd9d05369",
  "sourceUnitDigest": "96a78de23befc0537f1e29d65e9fc09bdc559b0a335bb077ab5d950a3d644516",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "bối-cảnh-1",
  "targetUnitDigest": "96a78de23befc0537f1e29d65e9fc09bdc559b0a335bb077ab5d950a3d644516",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0018 — Mốc MVP2 của fgOS"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/specs/system-overview.md#bối-cảnh-1 (lines 108–108) into docs/platform/system-overview/spec.md#bối-cảnh-1 (lines 136–136), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
#### Bối cảnh

Quyết định `0016` chốt phát biểu MVP của fgOS: một người mới nộp MỘT yêu cầu
thật bằng văn xuôi tự do và nhận lại một thay đổi code thật, chạy được, có
test, sẵn sàng merge — với tối thiểu sự canh chừng của con người. MVP1 đã
chứng minh vế đó khi con người là người BẤM NÚT khởi động vòng lặp: nộp yêu
cầu rồi tự tay `pick` để hệ chạy tiếp không cần canh (`0016` điểm 2).

Việc còn lại là kiểm tra vế thứ hai: liệu VÒNG LÕI ấy (discover → decompose →
implement → return → review tới `done`) có ra kết cục TƯƠNG ĐƯƠNG hay không
khi không có bất kỳ cú bấm-tay nào khởi động nó — một dispatcher chạy độc lập
(`fgos-runner --once`) tự claim và tự đóng vòng, không cần con người chọn
việc. Đây chính là nội dung CoS đã amend của PBI `p-52601a01`
(`.bee/backlog.jsonl`, 2026-07-27T11:09:16Z): dựng và đối chiếu hai ca dry-run
sống trên testbed `repo/dogfood-fixture/` đã có sẵn — một do
`/fgOS:submit` + `/fgOS:pick` trong cùng phiên tương tác kích hoạt, một do
`/fgOS:submit` + `fgos-runner --once` độc lập kích hoạt — và ghi nhận kết
quả đối chiếu, không phải chỉ lập kế hoạch.
```

### Full target shown text

```text
#### Bối cảnh

Quyết định `0016` chốt phát biểu MVP của fgOS: một người mới nộp MỘT yêu cầu
thật bằng văn xuôi tự do và nhận lại một thay đổi code thật, chạy được, có
test, sẵn sàng merge — với tối thiểu sự canh chừng của con người. MVP1 đã
chứng minh vế đó khi con người là người BẤM NÚT khởi động vòng lặp: nộp yêu
cầu rồi tự tay `pick` để hệ chạy tiếp không cần canh (`0016` điểm 2).

Việc còn lại là kiểm tra vế thứ hai: liệu VÒNG LÕI ấy (discover → decompose →
implement → return → review tới `done`) có ra kết cục TƯƠNG ĐƯƠNG hay không
khi không có bất kỳ cú bấm-tay nào khởi động nó — một dispatcher chạy độc lập
(`fgos-runner --once`) tự claim và tự đóng vòng, không cần con người chọn
việc. Đây chính là nội dung CoS đã amend của PBI `p-52601a01`
(`.bee/backlog.jsonl`, 2026-07-27T11:09:16Z): dựng và đối chiếu hai ca dry-run
sống trên testbed `repo/dogfood-fixture/` đã có sẵn — một do
`/fgOS:submit` + `/fgOS:pick` trong cùng phiên tương tác kích hoạt, một do
`/fgOS:submit` + `fgos-runner --once` độc lập kích hoạt — và ghi nhận kết
quả đối chiếu, không phải chỉ lập kế hoạch.
```

### Unified diff

```diff
No text difference.
```

## claim_a8d74a2a27965dcf870e70ed08565fbc

Source: `docs/specs/system-overview.md#unheaded-block-26`. Target: `docs/platform/system-overview/spec.md#unheaded-block-29`.

Mechanical class: Unit-exact. Source digest: `5bedc043fd0f5b9beb02a149c7bc137bd310993dcf3b072e315e435fae4aa238`. Target digest: `5bedc043fd0f5b9beb02a149c7bc137bd310993dcf3b072e315e435fae4aa238`.

Full shown source SHA256: `5bedc043fd0f5b9beb02a149c7bc137bd310993dcf3b072e315e435fae4aa238`. Full shown target SHA256: `5bedc043fd0f5b9beb02a149c7bc137bd310993dcf3b072e315e435fae4aa238`.

### Proposed decision

```json
{
  "claimId": "claim_a8d74a2a27965dcf870e70ed08565fbc",
  "sourceUnitDigest": "5bedc043fd0f5b9beb02a149c7bc137bd310993dcf3b072e315e435fae4aa238",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-29",
  "targetUnitDigest": "5bedc043fd0f5b9beb02a149c7bc137bd310993dcf3b072e315e435fae4aa238",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0018 — Mốc MVP2 của fgOS",
    "Bối cảnh"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-26 (lines 110–114) into docs/platform/system-overview/spec.md#unheaded-block-29 (lines 138–142), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Quyết định `0016` chốt phát biểu MVP của fgOS: một người mới nộp MỘT yêu cầu
thật bằng văn xuôi tự do và nhận lại một thay đổi code thật, chạy được, có
test, sẵn sàng merge — với tối thiểu sự canh chừng của con người. MVP1 đã
chứng minh vế đó khi con người là người BẤM NÚT khởi động vòng lặp: nộp yêu
cầu rồi tự tay `pick` để hệ chạy tiếp không cần canh (`0016` điểm 2).
```

### Full target shown text

```text
Quyết định `0016` chốt phát biểu MVP của fgOS: một người mới nộp MỘT yêu cầu
thật bằng văn xuôi tự do và nhận lại một thay đổi code thật, chạy được, có
test, sẵn sàng merge — với tối thiểu sự canh chừng của con người. MVP1 đã
chứng minh vế đó khi con người là người BẤM NÚT khởi động vòng lặp: nộp yêu
cầu rồi tự tay `pick` để hệ chạy tiếp không cần canh (`0016` điểm 2).
```

### Unified diff

```diff
No text difference.
```

## claim_be30169061830cdd37c25306a9cb43d1

Source: `docs/specs/system-overview.md#unheaded-block-27`. Target: `docs/platform/system-overview/spec.md#unheaded-block-30`.

Mechanical class: Unit-exact. Source digest: `cfcaec056453d9890a1714412a4cac491c6fe59d09b63e4240e2f0f6e08a1cf9`. Target digest: `cfcaec056453d9890a1714412a4cac491c6fe59d09b63e4240e2f0f6e08a1cf9`.

Full shown source SHA256: `cfcaec056453d9890a1714412a4cac491c6fe59d09b63e4240e2f0f6e08a1cf9`. Full shown target SHA256: `cfcaec056453d9890a1714412a4cac491c6fe59d09b63e4240e2f0f6e08a1cf9`.

### Proposed decision

```json
{
  "claimId": "claim_be30169061830cdd37c25306a9cb43d1",
  "sourceUnitDigest": "cfcaec056453d9890a1714412a4cac491c6fe59d09b63e4240e2f0f6e08a1cf9",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-30",
  "targetUnitDigest": "cfcaec056453d9890a1714412a4cac491c6fe59d09b63e4240e2f0f6e08a1cf9",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0018 — Mốc MVP2 của fgOS",
    "Bối cảnh"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-27 (lines 116–125) into docs/platform/system-overview/spec.md#unheaded-block-30 (lines 144–153), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Việc còn lại là kiểm tra vế thứ hai: liệu VÒNG LÕI ấy (discover → decompose →
implement → return → review tới `done`) có ra kết cục TƯƠNG ĐƯƠNG hay không
khi không có bất kỳ cú bấm-tay nào khởi động nó — một dispatcher chạy độc lập
(`fgos-runner --once`) tự claim và tự đóng vòng, không cần con người chọn
việc. Đây chính là nội dung CoS đã amend của PBI `p-52601a01`
(`.bee/backlog.jsonl`, 2026-07-27T11:09:16Z): dựng và đối chiếu hai ca dry-run
sống trên testbed `repo/dogfood-fixture/` đã có sẵn — một do
`/fgOS:submit` + `/fgOS:pick` trong cùng phiên tương tác kích hoạt, một do
`/fgOS:submit` + `fgos-runner --once` độc lập kích hoạt — và ghi nhận kết
quả đối chiếu, không phải chỉ lập kế hoạch.
```

### Full target shown text

```text
Việc còn lại là kiểm tra vế thứ hai: liệu VÒNG LÕI ấy (discover → decompose →
implement → return → review tới `done`) có ra kết cục TƯƠNG ĐƯƠNG hay không
khi không có bất kỳ cú bấm-tay nào khởi động nó — một dispatcher chạy độc lập
(`fgos-runner --once`) tự claim và tự đóng vòng, không cần con người chọn
việc. Đây chính là nội dung CoS đã amend của PBI `p-52601a01`
(`.bee/backlog.jsonl`, 2026-07-27T11:09:16Z): dựng và đối chiếu hai ca dry-run
sống trên testbed `repo/dogfood-fixture/` đã có sẵn — một do
`/fgOS:submit` + `/fgOS:pick` trong cùng phiên tương tác kích hoạt, một do
`/fgOS:submit` + `fgos-runner --once` độc lập kích hoạt — và ghi nhận kết
quả đối chiếu, không phải chỉ lập kế hoạch.
```

### Unified diff

```diff
No text difference.
```

## claim_2a42e7948e9cf6a5b0669d88ffe6f3d1

Source: `docs/specs/system-overview.md#quyết-định-1`. Target: `docs/platform/system-overview/spec.md#quyết-định-1`.

Mechanical class: Weak-exact. Source digest: `b5d0c86a66366ee6826b4a9f730c2737c63171c35c58cedc93362e6da10a5d8e`. Target digest: `b5d0c86a66366ee6826b4a9f730c2737c63171c35c58cedc93362e6da10a5d8e`.

Full shown source SHA256: `fab819f2b8636f40e10ab73a6f0821142af6c4bce0df48bed463a7af2a90153b`. Full shown target SHA256: `fab819f2b8636f40e10ab73a6f0821142af6c4bce0df48bed463a7af2a90153b`.

### Proposed decision

```json
{
  "claimId": "claim_2a42e7948e9cf6a5b0669d88ffe6f3d1",
  "sourceUnitDigest": "b5d0c86a66366ee6826b4a9f730c2737c63171c35c58cedc93362e6da10a5d8e",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "quyết-định-1",
  "targetUnitDigest": "b5d0c86a66366ee6826b4a9f730c2737c63171c35c58cedc93362e6da10a5d8e",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0018 — Mốc MVP2 của fgOS"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/specs/system-overview.md#quyết-định-1 (lines 127–127) into docs/platform/system-overview/spec.md#quyết-định-1 (lines 155–155), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
#### Quyết định

1. **Phát biểu MVP2 (chốt, mở rộng `0016`):**

   > MVP1 (`0016`) đã chứng minh một yêu cầu do con người BẤM NÚT khởi động
   > đi trọn vòng lõi tới `done`. MVP2 chứng minh CHÍNH vòng lõi đó
   > (discover → decompose → implement → return → review tới `done`) đạt
   > kết cục TƯƠNG ĐƯƠNG khi khởi động **không có bất kỳ cú bấm-tay nào** —
   > một dispatcher chạy độc lập (headless) tự đóng trọn vòng, không cần
   > con người chọn việc.

2. **"Tương đương" có răng đo được (kế thừa khung đo của `0016` điểm 2):**
   cả hai ca — ca tương tác (`/fgOS:pick`) và ca headless
   (`fgos-runner --once`) — phải cùng đạt: verify xanh, một commit thật trên
   nhánh riêng của item, và dọn worktree sạch sau khi xong. Một khác biệt
   giữa hai kết cục là một GAP THẬT, được ghi nhận thành một dòng `proposed`
   mới trong `repo/docs/backlog.md`, không âm thầm bỏ qua.

3. **Trục MVP2 bổ sung cho trục MVP1, không thay thế:** `0016` chứng minh
   vòng lõi CHẠY ĐƯỢC khi con người khởi động; `0018` chứng minh CHÍNH vòng
   lõi ấy chạy được khi con người KHÔNG khởi động. Đây là cùng một vòng lõi
   được kiểm chứng dưới hai đường kích hoạt khác nhau, không phải một tính
   năng mới.

4. **Phạm vi MVP2 vẫn là "một yêu cầu → một code change"** — kế thừa nguyên
   trạng giới hạn phạm vi của `0016` điểm 4 (không đòi goal-directed
   planning). MVP2 chỉ đổi CÁCH vòng lõi được khởi động, không mở rộng
   những gì vòng lõi phải làm.
```

### Full target shown text

```text
#### Quyết định

1. **Phát biểu MVP2 (chốt, mở rộng `0016`):**

   > MVP1 (`0016`) đã chứng minh một yêu cầu do con người BẤM NÚT khởi động
   > đi trọn vòng lõi tới `done`. MVP2 chứng minh CHÍNH vòng lõi đó
   > (discover → decompose → implement → return → review tới `done`) đạt
   > kết cục TƯƠNG ĐƯƠNG khi khởi động **không có bất kỳ cú bấm-tay nào** —
   > một dispatcher chạy độc lập (headless) tự đóng trọn vòng, không cần
   > con người chọn việc.

2. **"Tương đương" có răng đo được (kế thừa khung đo của `0016` điểm 2):**
   cả hai ca — ca tương tác (`/fgOS:pick`) và ca headless
   (`fgos-runner --once`) — phải cùng đạt: verify xanh, một commit thật trên
   nhánh riêng của item, và dọn worktree sạch sau khi xong. Một khác biệt
   giữa hai kết cục là một GAP THẬT, được ghi nhận thành một dòng `proposed`
   mới trong `repo/docs/backlog.md`, không âm thầm bỏ qua.

3. **Trục MVP2 bổ sung cho trục MVP1, không thay thế:** `0016` chứng minh
   vòng lõi CHẠY ĐƯỢC khi con người khởi động; `0018` chứng minh CHÍNH vòng
   lõi ấy chạy được khi con người KHÔNG khởi động. Đây là cùng một vòng lõi
   được kiểm chứng dưới hai đường kích hoạt khác nhau, không phải một tính
   năng mới.

4. **Phạm vi MVP2 vẫn là "một yêu cầu → một code change"** — kế thừa nguyên
   trạng giới hạn phạm vi của `0016` điểm 4 (không đòi goal-directed
   planning). MVP2 chỉ đổi CÁCH vòng lõi được khởi động, không mở rộng
   những gì vòng lõi phải làm.
```

### Unified diff

```diff
No text difference.
```

## claim_3896e8487b1c4a502fa08e1e4cc26569

Source: `docs/specs/system-overview.md#unheaded-block-28`. Target: `docs/platform/system-overview/spec.md#unheaded-block-31`.

Mechanical class: Unit-exact. Source digest: `0de3ef01e06f1fcfd6962045ce23135b4eef52be58a18bdd696bcdde2e9814d1`. Target digest: `0de3ef01e06f1fcfd6962045ce23135b4eef52be58a18bdd696bcdde2e9814d1`.

Full shown source SHA256: `0de3ef01e06f1fcfd6962045ce23135b4eef52be58a18bdd696bcdde2e9814d1`. Full shown target SHA256: `0de3ef01e06f1fcfd6962045ce23135b4eef52be58a18bdd696bcdde2e9814d1`.

### Proposed decision

```json
{
  "claimId": "claim_3896e8487b1c4a502fa08e1e4cc26569",
  "sourceUnitDigest": "0de3ef01e06f1fcfd6962045ce23135b4eef52be58a18bdd696bcdde2e9814d1",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-31",
  "targetUnitDigest": "0de3ef01e06f1fcfd6962045ce23135b4eef52be58a18bdd696bcdde2e9814d1",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0018 — Mốc MVP2 của fgOS",
    "Quyết định"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-28 (lines 129–129) into docs/platform/system-overview/spec.md#unheaded-block-31 (lines 157–157), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
1. **Phát biểu MVP2 (chốt, mở rộng `0016`):**
```

### Full target shown text

```text
1. **Phát biểu MVP2 (chốt, mở rộng `0016`):**
```

### Unified diff

```diff
No text difference.
```

## claim_0c547ee415203e07aa4398721189d059

Source: `docs/specs/system-overview.md#unheaded-block-29`. Target: `docs/platform/system-overview/spec.md#unheaded-block-32`.

Mechanical class: Unit-exact. Source digest: `1c22583dfa5df8b579c1f83189ceb473287395f5d401014c5d6a8a830b7249a5`. Target digest: `1c22583dfa5df8b579c1f83189ceb473287395f5d401014c5d6a8a830b7249a5`.

Full shown source SHA256: `1c22583dfa5df8b579c1f83189ceb473287395f5d401014c5d6a8a830b7249a5`. Full shown target SHA256: `1c22583dfa5df8b579c1f83189ceb473287395f5d401014c5d6a8a830b7249a5`.

### Proposed decision

```json
{
  "claimId": "claim_0c547ee415203e07aa4398721189d059",
  "sourceUnitDigest": "1c22583dfa5df8b579c1f83189ceb473287395f5d401014c5d6a8a830b7249a5",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-32",
  "targetUnitDigest": "1c22583dfa5df8b579c1f83189ceb473287395f5d401014c5d6a8a830b7249a5",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0018 — Mốc MVP2 của fgOS",
    "Quyết định"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-29 (lines 131–136) into docs/platform/system-overview/spec.md#unheaded-block-32 (lines 159–164), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
> MVP1 (`0016`) đã chứng minh một yêu cầu do con người BẤM NÚT khởi động
   > đi trọn vòng lõi tới `done`. MVP2 chứng minh CHÍNH vòng lõi đó
   > (discover → decompose → implement → return → review tới `done`) đạt
   > kết cục TƯƠNG ĐƯƠNG khi khởi động **không có bất kỳ cú bấm-tay nào** —
   > một dispatcher chạy độc lập (headless) tự đóng trọn vòng, không cần
   > con người chọn việc.
```

### Full target shown text

```text
> MVP1 (`0016`) đã chứng minh một yêu cầu do con người BẤM NÚT khởi động
   > đi trọn vòng lõi tới `done`. MVP2 chứng minh CHÍNH vòng lõi đó
   > (discover → decompose → implement → return → review tới `done`) đạt
   > kết cục TƯƠNG ĐƯƠNG khi khởi động **không có bất kỳ cú bấm-tay nào** —
   > một dispatcher chạy độc lập (headless) tự đóng trọn vòng, không cần
   > con người chọn việc.
```

### Unified diff

```diff
No text difference.
```

## claim_97110ce56cb3d3059bab67d4074711f3

Source: `docs/specs/system-overview.md#unheaded-block-30`. Target: `docs/platform/system-overview/spec.md#unheaded-block-33`.

Mechanical class: Unit-exact. Source digest: `7d17b81b13d11a426667a81a8428ada6727d6f3f405882a5e5a6f9c8b7cc6a21`. Target digest: `7d17b81b13d11a426667a81a8428ada6727d6f3f405882a5e5a6f9c8b7cc6a21`.

Full shown source SHA256: `7d17b81b13d11a426667a81a8428ada6727d6f3f405882a5e5a6f9c8b7cc6a21`. Full shown target SHA256: `7d17b81b13d11a426667a81a8428ada6727d6f3f405882a5e5a6f9c8b7cc6a21`.

### Proposed decision

```json
{
  "claimId": "claim_97110ce56cb3d3059bab67d4074711f3",
  "sourceUnitDigest": "7d17b81b13d11a426667a81a8428ada6727d6f3f405882a5e5a6f9c8b7cc6a21",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-33",
  "targetUnitDigest": "7d17b81b13d11a426667a81a8428ada6727d6f3f405882a5e5a6f9c8b7cc6a21",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0018 — Mốc MVP2 của fgOS",
    "Quyết định"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-30 (lines 138–143) into docs/platform/system-overview/spec.md#unheaded-block-33 (lines 166–171), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
2. **"Tương đương" có răng đo được (kế thừa khung đo của `0016` điểm 2):**
   cả hai ca — ca tương tác (`/fgOS:pick`) và ca headless
   (`fgos-runner --once`) — phải cùng đạt: verify xanh, một commit thật trên
   nhánh riêng của item, và dọn worktree sạch sau khi xong. Một khác biệt
   giữa hai kết cục là một GAP THẬT, được ghi nhận thành một dòng `proposed`
   mới trong `repo/docs/backlog.md`, không âm thầm bỏ qua.
```

### Full target shown text

```text
2. **"Tương đương" có răng đo được (kế thừa khung đo của `0016` điểm 2):**
   cả hai ca — ca tương tác (`/fgOS:pick`) và ca headless
   (`fgos-runner --once`) — phải cùng đạt: verify xanh, một commit thật trên
   nhánh riêng của item, và dọn worktree sạch sau khi xong. Một khác biệt
   giữa hai kết cục là một GAP THẬT, được ghi nhận thành một dòng `proposed`
   mới trong `repo/docs/backlog.md`, không âm thầm bỏ qua.
```

### Unified diff

```diff
No text difference.
```

## claim_38f1e2e35131f4d1ef4e01faa746104c

Source: `docs/specs/system-overview.md#unheaded-block-31`. Target: `docs/platform/system-overview/spec.md#unheaded-block-34`.

Mechanical class: Unit-exact. Source digest: `2a59fb70a1d29878ac4c71a1f8494d4da8f504726c35e727c1feae01b8e7e78a`. Target digest: `2a59fb70a1d29878ac4c71a1f8494d4da8f504726c35e727c1feae01b8e7e78a`.

Full shown source SHA256: `2a59fb70a1d29878ac4c71a1f8494d4da8f504726c35e727c1feae01b8e7e78a`. Full shown target SHA256: `2a59fb70a1d29878ac4c71a1f8494d4da8f504726c35e727c1feae01b8e7e78a`.

### Proposed decision

```json
{
  "claimId": "claim_38f1e2e35131f4d1ef4e01faa746104c",
  "sourceUnitDigest": "2a59fb70a1d29878ac4c71a1f8494d4da8f504726c35e727c1feae01b8e7e78a",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-34",
  "targetUnitDigest": "2a59fb70a1d29878ac4c71a1f8494d4da8f504726c35e727c1feae01b8e7e78a",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0018 — Mốc MVP2 của fgOS",
    "Quyết định"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-31 (lines 145–149) into docs/platform/system-overview/spec.md#unheaded-block-34 (lines 173–177), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
3. **Trục MVP2 bổ sung cho trục MVP1, không thay thế:** `0016` chứng minh
   vòng lõi CHẠY ĐƯỢC khi con người khởi động; `0018` chứng minh CHÍNH vòng
   lõi ấy chạy được khi con người KHÔNG khởi động. Đây là cùng một vòng lõi
   được kiểm chứng dưới hai đường kích hoạt khác nhau, không phải một tính
   năng mới.
```

### Full target shown text

```text
3. **Trục MVP2 bổ sung cho trục MVP1, không thay thế:** `0016` chứng minh
   vòng lõi CHẠY ĐƯỢC khi con người khởi động; `0018` chứng minh CHÍNH vòng
   lõi ấy chạy được khi con người KHÔNG khởi động. Đây là cùng một vòng lõi
   được kiểm chứng dưới hai đường kích hoạt khác nhau, không phải một tính
   năng mới.
```

### Unified diff

```diff
No text difference.
```

## claim_fedfd557e7552807eb22937a1c793f7c

Source: `docs/specs/system-overview.md#unheaded-block-32`. Target: `docs/platform/system-overview/spec.md#unheaded-block-35`.

Mechanical class: Unit-exact. Source digest: `9189c0c2e0e5bf383bbbb1f2c878a571f412fc1469b8bfcb4cdfafe034b585b9`. Target digest: `9189c0c2e0e5bf383bbbb1f2c878a571f412fc1469b8bfcb4cdfafe034b585b9`.

Full shown source SHA256: `9189c0c2e0e5bf383bbbb1f2c878a571f412fc1469b8bfcb4cdfafe034b585b9`. Full shown target SHA256: `9189c0c2e0e5bf383bbbb1f2c878a571f412fc1469b8bfcb4cdfafe034b585b9`.

### Proposed decision

```json
{
  "claimId": "claim_fedfd557e7552807eb22937a1c793f7c",
  "sourceUnitDigest": "9189c0c2e0e5bf383bbbb1f2c878a571f412fc1469b8bfcb4cdfafe034b585b9",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-35",
  "targetUnitDigest": "9189c0c2e0e5bf383bbbb1f2c878a571f412fc1469b8bfcb4cdfafe034b585b9",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0018 — Mốc MVP2 của fgOS",
    "Quyết định"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-32 (lines 151–154) into docs/platform/system-overview/spec.md#unheaded-block-35 (lines 179–182), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
4. **Phạm vi MVP2 vẫn là "một yêu cầu → một code change"** — kế thừa nguyên
   trạng giới hạn phạm vi của `0016` điểm 4 (không đòi goal-directed
   planning). MVP2 chỉ đổi CÁCH vòng lõi được khởi động, không mở rộng
   những gì vòng lõi phải làm.
```

### Full target shown text

```text
4. **Phạm vi MVP2 vẫn là "một yêu cầu → một code change"** — kế thừa nguyên
   trạng giới hạn phạm vi của `0016` điểm 4 (không đòi goal-directed
   planning). MVP2 chỉ đổi CÁCH vòng lõi được khởi động, không mở rộng
   những gì vòng lõi phải làm.
```

### Unified diff

```diff
No text difference.
```

## claim_8addbe77bbe7ad17a77d2385904658b0

Source: `docs/specs/system-overview.md#hệ-quả-1`. Target: `docs/platform/system-overview/spec.md#hệ-quả-1`.

Mechanical class: Weak-exact. Source digest: `2cf00510b9d558c06aff7ab045f246c2d24ceef764d7afe2a190d00933be0433`. Target digest: `2cf00510b9d558c06aff7ab045f246c2d24ceef764d7afe2a190d00933be0433`.

Full shown source SHA256: `b5e249650414324e2780f38a8e55c3efcb2eb38327ed6ab36d89eb387368b704`. Full shown target SHA256: `b5e249650414324e2780f38a8e55c3efcb2eb38327ed6ab36d89eb387368b704`.

### Proposed decision

```json
{
  "claimId": "claim_8addbe77bbe7ad17a77d2385904658b0",
  "sourceUnitDigest": "2cf00510b9d558c06aff7ab045f246c2d24ceef764d7afe2a190d00933be0433",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "hệ-quả-1",
  "targetUnitDigest": "2cf00510b9d558c06aff7ab045f246c2d24ceef764d7afe2a190d00933be0433",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0018 — Mốc MVP2 của fgOS"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/specs/system-overview.md#hệ-quả-1 (lines 156–156) into docs/platform/system-overview/spec.md#hệ-quả-1 (lines 184–184), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
#### Hệ quả

- Testbed và hạ tầng dùng để chứng minh MVP2 (`repo/dogfood-fixture/`,
  `repo/.fgos-runner.json`, `src/runner/worktree.mjs`) đã có sẵn từ trước —
  quyết định này không kéo theo việc dựng hạ tầng mới, chỉ ghi nhận phát
  biểu mốc và kết quả đối chiếu hai ca chạy thật.
- Bất kỳ khoảng cách nào giữa ca tương tác và ca headless được đối chiếu ra
  (kể cả trường hợp một trong hai đường không thể chạy an toàn với hạ tầng
  hiện có) là một phát hiện gap thật của chính mốc MVP2 này, được nạp vào
  `repo/docs/backlog.md` như một dòng `proposed`, không phải điều kiện thất
  bại của quyết định — quyết định vẫn đứng, gap trở thành việc kế tiếp.
- **Không supersede `0016`** — `0018` mở rộng trục MVP đã chốt bằng vế
  headless, không đổi phát biểu MVP1 hay luật L1–L10.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target shown text

```text
#### Hệ quả

- Testbed và hạ tầng dùng để chứng minh MVP2 (`repo/dogfood-fixture/`,
  `repo/.fgos-runner.json`, `src/runner/worktree.mjs`) đã có sẵn từ trước —
  quyết định này không kéo theo việc dựng hạ tầng mới, chỉ ghi nhận phát
  biểu mốc và kết quả đối chiếu hai ca chạy thật.
- Bất kỳ khoảng cách nào giữa ca tương tác và ca headless được đối chiếu ra
  (kể cả trường hợp một trong hai đường không thể chạy an toàn với hạ tầng
  hiện có) là một phát hiện gap thật của chính mốc MVP2 này, được nạp vào
  `repo/docs/backlog.md` như một dòng `proposed`, không phải điều kiện thất
  bại của quyết định — quyết định vẫn đứng, gap trở thành việc kế tiếp.
- **Không supersede `0016`** — `0018` mở rộng trục MVP đã chốt bằng vế
  headless, không đổi phát biểu MVP1 hay luật L1–L10.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Unified diff

```diff
No text difference.
```

## claim_bfaf8e0fcafcfc6ad16729de4d245dab

Source: `docs/specs/system-overview.md#unheaded-block-33`. Target: `docs/platform/system-overview/spec.md#unheaded-block-36`.

Mechanical class: Unit-exact. Source digest: `07774fa3f663a59a126b7b877d4754a38131a7a323bdf1949f143fc6765c57d9`. Target digest: `07774fa3f663a59a126b7b877d4754a38131a7a323bdf1949f143fc6765c57d9`.

Full shown source SHA256: `07774fa3f663a59a126b7b877d4754a38131a7a323bdf1949f143fc6765c57d9`. Full shown target SHA256: `07774fa3f663a59a126b7b877d4754a38131a7a323bdf1949f143fc6765c57d9`.

### Proposed decision

```json
{
  "claimId": "claim_bfaf8e0fcafcfc6ad16729de4d245dab",
  "sourceUnitDigest": "07774fa3f663a59a126b7b877d4754a38131a7a323bdf1949f143fc6765c57d9",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-36",
  "targetUnitDigest": "07774fa3f663a59a126b7b877d4754a38131a7a323bdf1949f143fc6765c57d9",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0018 — Mốc MVP2 của fgOS",
    "Hệ quả"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-33 (lines 158–168) into docs/platform/system-overview/spec.md#unheaded-block-36 (lines 186–196), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- Testbed và hạ tầng dùng để chứng minh MVP2 (`repo/dogfood-fixture/`,
  `repo/.fgos-runner.json`, `src/runner/worktree.mjs`) đã có sẵn từ trước —
  quyết định này không kéo theo việc dựng hạ tầng mới, chỉ ghi nhận phát
  biểu mốc và kết quả đối chiếu hai ca chạy thật.
- Bất kỳ khoảng cách nào giữa ca tương tác và ca headless được đối chiếu ra
  (kể cả trường hợp một trong hai đường không thể chạy an toàn với hạ tầng
  hiện có) là một phát hiện gap thật của chính mốc MVP2 này, được nạp vào
  `repo/docs/backlog.md` như một dòng `proposed`, không phải điều kiện thất
  bại của quyết định — quyết định vẫn đứng, gap trở thành việc kế tiếp.
- **Không supersede `0016`** — `0018` mở rộng trục MVP đã chốt bằng vế
  headless, không đổi phát biểu MVP1 hay luật L1–L10.
```

### Full target shown text

```text
- Testbed và hạ tầng dùng để chứng minh MVP2 (`repo/dogfood-fixture/`,
  `repo/.fgos-runner.json`, `src/runner/worktree.mjs`) đã có sẵn từ trước —
  quyết định này không kéo theo việc dựng hạ tầng mới, chỉ ghi nhận phát
  biểu mốc và kết quả đối chiếu hai ca chạy thật.
- Bất kỳ khoảng cách nào giữa ca tương tác và ca headless được đối chiếu ra
  (kể cả trường hợp một trong hai đường không thể chạy an toàn với hạ tầng
  hiện có) là một phát hiện gap thật của chính mốc MVP2 này, được nạp vào
  `repo/docs/backlog.md` như một dòng `proposed`, không phải điều kiện thất
  bại của quyết định — quyết định vẫn đứng, gap trở thành việc kế tiếp.
- **Không supersede `0016`** — `0018` mở rộng trục MVP đã chốt bằng vế
  headless, không đổi phát biểu MVP1 hay luật L1–L10.
```

### Unified diff

```diff
No text difference.
```

## claim_ba26d5145625a6a74f3d1f4801c35407

Source: `docs/specs/system-overview.md#unheaded-block-34`. Target: `docs/platform/system-overview/spec.md#unheaded-block-37`.

Mechanical class: Judgment. Source digest: `95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104`. Target digest: `95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104`.

Full shown source SHA256: `95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104`. Full shown target SHA256: `95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104`.

### Proposed decision

```json
{
  "claimId": "claim_ba26d5145625a6a74f3d1f4801c35407",
  "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
  "targetOwner": "docs/platform/system-overview/spec.md",
  "targetAnchor": "unheaded-block-37",
  "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
  "targetAncestry": [
    "Spec: System Overview",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0018 — Mốc MVP2 của fgOS",
    "Hệ quả"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: digest match points to another occurrence; use the source occurrence line-mapped carrier. Carry the complete unheaded-block at docs/specs/system-overview.md#unheaded-block-34 (lines 170–170) into docs/platform/system-overview/spec.md#unheaded-block-37 (lines 198–198), the frozen whole-system spec owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
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
