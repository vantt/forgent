# Review pack: b-io-contract

Pack commit: a7d561538a9ec6192ce5a513b3cc7f006f995fb7

Pack id: 3bfaa5e4f497335805f0c923d815fba22bccc3d35abb457ccb698f9d379510c1

Author session: codex-session:1@2026-10-08

## claim_9466cce125cf03619e4d50ff9f340dcb

Source: docs/io-contract.md#hợp-đồng-io-của-fgos-cửa-cli-bề-mặt-stdout-của-fgos-runner

Target: docs/platform/work-state/contracts/cli-io-contract.md#1-purpose-and-scope

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_9466cce125cf03619e4d50ff9f340dcb |
| sourceUnitDigest | f72297b85c91b398 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | 1-purpose-and-scope |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | Document H1 of the legacy contract; the frozen map section 5 places it under the candidate heading 1. Purpose And Scope (the candidate H1 'CLI I/O Contract' is the document title), so the Vietnamese title is replaced by an English heading title. |
| targetUnitDigest | 11a6e0e929f3ed69d0f883a5385618ea |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
# Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`

Hợp đồng giao tiếp VÀO/RA hạng nhất cho bề mặt CLI của fgOS (`bin/fgos.mjs`)
và bề mặt stdout của vòng tự hành (`bin/fgos-runner.mjs`), theo record
[0014](decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md) (kiến trúc cửa, đã
khoá) và [0011](decisions/0011-version-tuong-minh-cho-moi-contract.md) (mọi
contract mang version tường minh `<name>/v<N>`). Tài liệu này là bản chốt
bằng văn xuôi hợp nhất những gì `str46-io-contract` đã dựng qua ba lát —
không phải code runtime mới, không lặp lại chi tiết cài đặt đã có trong
`docs/specs/work-state.md`/`docs/specs/runner.md`.

**Mục tiêu:** một transport MỚI (terminal, pane, chat, web, thứ chưa nghĩ
ra) cắm vào chỉ bằng cách dịch transport→verb (chiều vào) và đọc envelope/sổ
verb (chiều ra) — không mở đường ghi riêng, không phải đoán hình dạng output
bằng cách đọc mã.
```

### Target unit

```text
## 1. Purpose And Scope

Hợp đồng giao tiếp VÀO/RA hạng nhất cho bề mặt CLI của fgOS (`bin/fgos.mjs`)
và bề mặt stdout của vòng tự hành (`bin/fgos-runner.mjs`), theo record
`0014` (`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md`) (kiến trúc cửa, đã
khoá) và [0011](../decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract) (mọi
contract mang version tường minh `<name>/v<N>`). Tài liệu này là bản chốt
bằng văn xuôi hợp nhất những gì `str46-io-contract` đã dựng qua ba lát —
không phải code runtime mới, không lặp lại chi tiết cài đặt đã có trong
`docs/specs/work-state.md`/`docs/specs/runner.md`.

**Mục tiêu:** một transport MỚI (terminal, pane, chat, web, thứ chưa nghĩ
ra) cắm vào chỉ bằng cách dịch transport→verb (chiều vào) và đọc envelope/sổ
verb (chiều ra) — không mở đường ghi riêng, không phải đoán hình dạng output
bằng cách đọc mã.
```

### Unified diff

```diff
--- "docs/io-contract.md#hợp-đồng-io-của-fgos-cửa-cli-bề-mặt-stdout-của-fgos-runner"
+++ "docs/platform/work-state/contracts/cli-io-contract.md#1-purpose-and-scope"
@@ -1,9 +1,9 @@
-# Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`
+## 1. Purpose And Scope
 
 Hợp đồng giao tiếp VÀO/RA hạng nhất cho bề mặt CLI của fgOS (`bin/fgos.mjs`)
 và bề mặt stdout của vòng tự hành (`bin/fgos-runner.mjs`), theo record
-[0014](decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md) (kiến trúc cửa, đã
-khoá) và [0011](decisions/0011-version-tuong-minh-cho-moi-contract.md) (mọi
+`0014` (`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md`) (kiến trúc cửa, đã
+khoá) và [0011](../decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract) (mọi
 contract mang version tường minh `<name>/v<N>`). Tài liệu này là bản chốt
 bằng văn xuôi hợp nhất những gì `str46-io-contract` đã dựng qua ba lát —
 không phải code runtime mới, không lặp lại chi tiết cài đặt đã có trong
```

## claim_1b5bd12129cc41ea75fc7dd3993142f3

Source: docs/io-contract.md#unheaded-block-1

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-2

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_1b5bd12129cc41ea75fc7dd3993142f3 |
| sourceUnitDigest | 476e7efba05e358c |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-2 |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | Intro paragraph carried into 1. Purpose And Scope as its own block but CHANGED in two links: the 0014 link (decisions/0014-... .md, dead after the decision corpus retired) is rewritten to plain code text \`0014\` plus its path, and the 0011 link is repointed to retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract; the rest of the text is verbatim. |
| targetUnitDigest | fb2a927391a144152bec76f586c13c1f |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
Hợp đồng giao tiếp VÀO/RA hạng nhất cho bề mặt CLI của fgOS (`bin/fgos.mjs`)
và bề mặt stdout của vòng tự hành (`bin/fgos-runner.mjs`), theo record
[0014](decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md) (kiến trúc cửa, đã
khoá) và [0011](decisions/0011-version-tuong-minh-cho-moi-contract.md) (mọi
contract mang version tường minh `<name>/v<N>`). Tài liệu này là bản chốt
bằng văn xuôi hợp nhất những gì `str46-io-contract` đã dựng qua ba lát —
không phải code runtime mới, không lặp lại chi tiết cài đặt đã có trong
`docs/specs/work-state.md`/`docs/specs/runner.md`.
```

### Target unit

```text
Hợp đồng giao tiếp VÀO/RA hạng nhất cho bề mặt CLI của fgOS (`bin/fgos.mjs`)
và bề mặt stdout của vòng tự hành (`bin/fgos-runner.mjs`), theo record
`0014` (`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md`) (kiến trúc cửa, đã
khoá) và [0011](../decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract) (mọi
contract mang version tường minh `<name>/v<N>`). Tài liệu này là bản chốt
bằng văn xuôi hợp nhất những gì `str46-io-contract` đã dựng qua ba lát —
không phải code runtime mới, không lặp lại chi tiết cài đặt đã có trong
`docs/specs/work-state.md`/`docs/specs/runner.md`.
```

### Unified diff

```diff
--- "docs/io-contract.md#unheaded-block-1"
+++ "docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-2"
@@ -1,7 +1,7 @@
 Hợp đồng giao tiếp VÀO/RA hạng nhất cho bề mặt CLI của fgOS (`bin/fgos.mjs`)
 và bề mặt stdout của vòng tự hành (`bin/fgos-runner.mjs`), theo record
-[0014](decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md) (kiến trúc cửa, đã
-khoá) và [0011](decisions/0011-version-tuong-minh-cho-moi-contract.md) (mọi
+`0014` (`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md`) (kiến trúc cửa, đã
+khoá) và [0011](../decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract) (mọi
 contract mang version tường minh `<name>/v<N>`). Tài liệu này là bản chốt
 bằng văn xuôi hợp nhất những gì `str46-io-contract` đã dựng qua ba lát —
 không phải code runtime mới, không lặp lại chi tiết cài đặt đã có trong
```

## claim_882ee3f986d0dacee87764a5b6bb75d8

Source: docs/io-contract.md#unheaded-block-2

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-3

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_882ee3f986d0dacee87764a5b6bb75d8 |
| sourceUnitDigest | accb25b08ef0d839 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-3 |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | The 'Mục tiêu' goal paragraph (new transport plugs in via transport-to-verb and envelope/manifest) is carried verbatim as the second block of 1. Purpose And Scope. |
| targetUnitDigest | accb25b08ef0d839f5a86e898250752f |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
**Mục tiêu:** một transport MỚI (terminal, pane, chat, web, thứ chưa nghĩ
ra) cắm vào chỉ bằng cách dịch transport→verb (chiều vào) và đọc envelope/sổ
verb (chiều ra) — không mở đường ghi riêng, không phải đoán hình dạng output
bằng cách đọc mã.
```

### Target unit

```text
**Mục tiêu:** một transport MỚI (terminal, pane, chat, web, thứ chưa nghĩ
ra) cắm vào chỉ bằng cách dịch transport→verb (chiều vào) và đọc envelope/sổ
verb (chiều ra) — không mở đường ghi riêng, không phải đoán hình dạng output
bằng cách đọc mã.
```

### Unified diff

```diff
No text difference.
```

## claim_51848961a2bbf93d37bc2b46d9f141f5

Source: docs/io-contract.md#chiều-vào-verb-danh-tính

Target: docs/platform/work-state/contracts/cli-io-contract.md#2-input-direction-verb-and-identity

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_51848961a2bbf93d37bc2b46d9f141f5 |
| sourceUnitDigest | 698037f4efe95080 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | 2-input-direction-verb-and-identity |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | Section heading 'Chiều vào — verb + danh tính' maps to the frozen heading '2. Input Direction Verb And Identity'; only the title language and numbering differ. |
| targetUnitDigest | 7c4e0214ec4c8c108c24c1b00a560516 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
## Chiều vào — verb + danh tính

Mọi thao tác ghi đi qua đúng **một cửa**: gọi verb của `bin/fgos.mjs`
(CTR001/CTR002). Không có đường ghi thứ hai vào `.fgos/`.

Mỗi lần ghi mang thêm một trường danh tính người/tiến-trình gọi, `writer`:

- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song
  song), luôn có mặt.
- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu
  tiên: `registry` (đối chiếu được với `.fgos/sessions.json`, tin nhất) ·
  `env` (biến môi trường, ai cũng set được) · `pid` (dò ngược tiến trình cha,
  best-effort) · `unresolved` (không nguồn nào xác nhận được — `id` vẫn là
  pid của chính tiến trình gọi, KHÔNG rỗng, KHÔNG vắng khoá; chỉ nhãn
  `source` nói giá trị chưa kiểm chứng được).

**Đây là quy thuộc, không phải xác thực** (D1): CLI local không xác thực
được ai đang gọi nó — ai chạy được `fgos` thì đã ghi thẳng vào `.fgos/`
được. Cổng này mua về dấu vết audit + chống nhầm giữa các phiên, không mua
về an ninh. Do đó **caller chưa xác danh KHÔNG bị chặn** gọi verb ghi — D9
chọn ghi-không-chặn để không gãy luồng người gõ tay/CI đang chạy; chặn thật
thuộc tầng phân quyền (STR38) và cửa mạng của daemon tương lai (STR48), cả
hai nằm NGOÀI hợp đồng này.

Song song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`
— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ
tư, gán tự động cho cạnh park nội bộ do máy sinh ra như hệ quả một verb,
không do ai quyết định). `role` và `writer` tách bạch: một cái nói "ai gây
ra", một cái nói "loại gì gây ra".
```

### Target unit

```text
## 2. Input Direction Verb And Identity
```

### Unified diff

```diff
--- "docs/io-contract.md#chiều-vào-verb-danh-tính"
+++ "docs/platform/work-state/contracts/cli-io-contract.md#2-input-direction-verb-and-identity"
@@ -1,29 +1 @@
-## Chiều vào — verb + danh tính
-
-Mọi thao tác ghi đi qua đúng **một cửa**: gọi verb của `bin/fgos.mjs`
-(CTR001/CTR002). Không có đường ghi thứ hai vào `.fgos/`.
-
-Mỗi lần ghi mang thêm một trường danh tính người/tiến-trình gọi, `writer`:
-
-- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song
-  song), luôn có mặt.
-- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu
-  tiên: `registry` (đối chiếu được với `.fgos/sessions.json`, tin nhất) ·
-  `env` (biến môi trường, ai cũng set được) · `pid` (dò ngược tiến trình cha,
-  best-effort) · `unresolved` (không nguồn nào xác nhận được — `id` vẫn là
-  pid của chính tiến trình gọi, KHÔNG rỗng, KHÔNG vắng khoá; chỉ nhãn
-  `source` nói giá trị chưa kiểm chứng được).
-
-**Đây là quy thuộc, không phải xác thực** (D1): CLI local không xác thực
-được ai đang gọi nó — ai chạy được `fgos` thì đã ghi thẳng vào `.fgos/`
-được. Cổng này mua về dấu vết audit + chống nhầm giữa các phiên, không mua
-về an ninh. Do đó **caller chưa xác danh KHÔNG bị chặn** gọi verb ghi — D9
-chọn ghi-không-chặn để không gãy luồng người gõ tay/CI đang chạy; chặn thật
-thuộc tầng phân quyền (STR38) và cửa mạng của daemon tương lai (STR48), cả
-hai nằm NGOÀI hợp đồng này.
-
-Song song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`
-— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ
-tư, gán tự động cho cạnh park nội bộ do máy sinh ra như hệ quả một verb,
-không do ai quyết định). `role` và `writer` tách bạch: một cái nói "ai gây
-ra", một cái nói "loại gì gây ra".
\ No newline at end of file
+## 2. Input Direction Verb And Identity
\ No newline at end of file
```

## claim_426f29d1e11055574c203d89cba84cc7

Source: docs/io-contract.md#unheaded-block-3

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-4

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_426f29d1e11055574c203d89cba84cc7 |
| sourceUnitDigest | 4d3e5ba86bd907ab |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-4 |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | Single write door rule (CTR001/CTR002, no second write path into .fgos/) carried verbatim under the new H3 Single Write Door; not stated in work-state.md so no merge. |
| targetUnitDigest | 4d3e5ba86bd907aba25dfcc099af5e28 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
Mọi thao tác ghi đi qua đúng **một cửa**: gọi verb của `bin/fgos.mjs`
(CTR001/CTR002). Không có đường ghi thứ hai vào `.fgos/`.
```

### Target unit

```text
Mọi thao tác ghi đi qua đúng **một cửa**: gọi verb của `bin/fgos.mjs`
(CTR001/CTR002). Không có đường ghi thứ hai vào `.fgos/`.
```

### Unified diff

```diff
No text difference.
```

## claim_b5ef9b491d020583ac6ca1379e4115a0

Source: docs/io-contract.md#unheaded-block-4

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-7

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_b5ef9b491d020583ac6ca1379e4115a0 |
| sourceUnitDigest | eed0b8520401ce77 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-7 |
| claimKind | contract |
| disposition | merge |
| reviewStatus | pending |
| rationale | Lead-in sentence for the writer field; the candidate keeps it verbatim inside Writer Identity next to the work-state.md writer text (map section 6 pairs io 22, 33-39 with ws 154-167), though it sits after the ws paragraph and before the io rationale paragraph. |
| targetUnitDigest | eed0b8520401ce77b1b75379282e3390 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
Mỗi lần ghi mang thêm một trường danh tính người/tiến-trình gọi, `writer`:
```

### Target unit

```text
Mỗi lần ghi mang thêm một trường danh tính người/tiến-trình gọi, `writer`:
```

### Unified diff

```diff
No text difference.
```

## claim_f5365b8e40fb58c75adc56a574263242

Source: docs/io-contract.md#unheaded-block-5

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-10

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f5365b8e40fb58c75adc56a574263242 |
| sourceUnitDigest | fa53d50b84fef302 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-10 |
| claimKind | contract |
| disposition | merge |
| reviewStatus | pending |
| rationale | writer.id / writer.source bullet list with the four trust values, carried verbatim under Writer Source Trust Levels; the same four-value claim is the table of work-state.md 169-174 under the same heading (map section 6). |
| targetUnitDigest | fa53d50b84fef3025e7b4e5e8e810a83 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song
  song), luôn có mặt.
- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu
  tiên: `registry` (đối chiếu được với `.fgos/sessions.json`, tin nhất) ·
  `env` (biến môi trường, ai cũng set được) · `pid` (dò ngược tiến trình cha,
  best-effort) · `unresolved` (không nguồn nào xác nhận được — `id` vẫn là
  pid của chính tiến trình gọi, KHÔNG rỗng, KHÔNG vắng khoá; chỉ nhãn
  `source` nói giá trị chưa kiểm chứng được).
```

### Target unit

```text
- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song
  song), luôn có mặt.
- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu
  tiên: `registry` (đối chiếu được với `.fgos/sessions.json`, tin nhất) ·
  `env` (biến môi trường, ai cũng set được) · `pid` (dò ngược tiến trình cha,
  best-effort) · `unresolved` (không nguồn nào xác nhận được — `id` vẫn là
  pid của chính tiến trình gọi, KHÔNG rỗng, KHÔNG vắng khoá; chỉ nhãn
  `source` nói giá trị chưa kiểm chứng được).
```

### Unified diff

```diff
No text difference.
```

## claim_cb629f70ad6029530d70253f96ad3221

Source: docs/io-contract.md#unheaded-block-6

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-8

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_cb629f70ad6029530d70253f96ad3221 |
| sourceUnitDigest | bd8b780f96dd2ecc |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-8 |
| claimKind | contract |
| disposition | merge |
| reviewStatus | pending |
| rationale | Attribution-not-authentication paragraph (D1, D9 never-block rationale, STR38/STR48 out of scope) carried verbatim in Writer Identity alongside the overlapping work-state.md 154-167 text; io-contract is the side that adds the never-block rationale. |
| targetUnitDigest | bd8b780f96dd2ecc5b5f628c94f6b5b3 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
**Đây là quy thuộc, không phải xác thực** (D1): CLI local không xác thực
được ai đang gọi nó — ai chạy được `fgos` thì đã ghi thẳng vào `.fgos/`
được. Cổng này mua về dấu vết audit + chống nhầm giữa các phiên, không mua
về an ninh. Do đó **caller chưa xác danh KHÔNG bị chặn** gọi verb ghi — D9
chọn ghi-không-chặn để không gãy luồng người gõ tay/CI đang chạy; chặn thật
thuộc tầng phân quyền (STR38) và cửa mạng của daemon tương lai (STR48), cả
hai nằm NGOÀI hợp đồng này.
```

### Target unit

```text
**Đây là quy thuộc, không phải xác thực** (D1): CLI local không xác thực
được ai đang gọi nó — ai chạy được `fgos` thì đã ghi thẳng vào `.fgos/`
được. Cổng này mua về dấu vết audit + chống nhầm giữa các phiên, không mua
về an ninh. Do đó **caller chưa xác danh KHÔNG bị chặn** gọi verb ghi — D9
chọn ghi-không-chặn để không gãy luồng người gõ tay/CI đang chạy; chặn thật
thuộc tầng phân quyền (STR38) và cửa mạng của daemon tương lai (STR48), cả
hai nằm NGOÀI hợp đồng này.
```

### Unified diff

```diff
No text difference.
```

## claim_153f56c2d5a2e895f8e6b2607bb7ab3d

Source: docs/io-contract.md#unheaded-block-7

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-13

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_153f56c2d5a2e895f8e6b2607bb7ab3d |
| sourceUnitDigest | 25e4a007d2fc9a15 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-13 |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | role vs writer paragraph (human/runner/session/system) carried verbatim under the new H3 Caller Role; no counterpart in work-state.md per the map. |
| targetUnitDigest | 25e4a007d2fc9a153cb3273376471f15 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
Song song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`
— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ
tư, gán tự động cho cạnh park nội bộ do máy sinh ra như hệ quả một verb,
không do ai quyết định). `role` và `writer` tách bạch: một cái nói "ai gây
ra", một cái nói "loại gì gây ra".
```

### Target unit

```text
Song song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`
— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ
tư, gán tự động cho cạnh park nội bộ do máy sinh ra như hệ quả một verb,
không do ai quyết định). `role` và `writer` tách bạch: một cái nói "ai gây
ra", một cái nói "loại gì gây ra".
```

### Unified diff

```diff
No text difference.
```

## claim_e9c39f67bc2eab533faa3053ff482708

Source: docs/io-contract.md#chiều-ra-envelope-thống-nhất

Target: docs/platform/work-state/contracts/cli-io-contract.md#3-output-direction-unified-envelope

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_e9c39f67bc2eab533faa3053ff482708 |
| sourceUnitDigest | e067ab7149569e51 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | 3-output-direction-unified-envelope |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | Section heading 'Chiều ra — envelope thống nhất' maps to the frozen heading '3. Output Direction Unified Envelope'; only the title language and numbering differ. |
| targetUnitDigest | 01eac1846cb1ba744cb0732c6b1b4773 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

````text
## Chiều ra — envelope thống nhất

Mọi verb thành công (ở CẢ HAI binary — `fgos.mjs` và, từ lát 2,
`fgos-runner.mjs`'s dòng kết-cục cuối) in một phong bì chuẩn `fgos.v1` ra
`stdout`:

```
{ contract: 'fgos.v1', generated_at, data_hash, data }
```

`data` có cấu trúc (trường tên rõ nghĩa), không phải câu xác nhận cho
người — verb đọc trả thẳng đối tượng kết quả, verb ghi trả đúng những
trường vừa đổi. Đường lỗi KHÔNG bọc phong bì: chẩn đoán đi `stderr`, thành/
bại phân biệt bằng **exit code**, không bao giờ bằng nội dung chuỗi.

**`fgos.mjs` in đúng một dòng phong bì mỗi lời gọi** (một-shot, nên in
nhiều dòng cho dễ đọc). **`fgos-runner` in MỘT phong bì mỗi lượt `--once`
hoặc mỗi chu kỳ `--watch`, liền một dòng** — vì `--watch` phát nhiều phong
bì nối tiếp theo thời gian, mỗi cái phải trọn trong đúng một dòng để bên
đọc tách được cái này với cái kia; con trỏ (dưới) áp dụng cùng lý do.

**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm
`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd "dòng
bắt đầu bằng `{`"), vì luồng progress-trace của `fgos-runner` (xem "Ngoại
lệ có lý do" dưới) có thể tự chứa output của trợ lý bắt đầu bằng `{`.
````

### Target unit

```text
## 3. Output Direction Unified Envelope
```

### Unified diff

````diff
--- "docs/io-contract.md#chiều-ra-envelope-thống-nhất"
+++ "docs/platform/work-state/contracts/cli-io-contract.md#3-output-direction-unified-envelope"
@@ -1,25 +1 @@
-## Chiều ra — envelope thống nhất
-
-Mọi verb thành công (ở CẢ HAI binary — `fgos.mjs` và, từ lát 2,
-`fgos-runner.mjs`'s dòng kết-cục cuối) in một phong bì chuẩn `fgos.v1` ra
-`stdout`:
-
-```
-{ contract: 'fgos.v1', generated_at, data_hash, data }
-```
-
-`data` có cấu trúc (trường tên rõ nghĩa), không phải câu xác nhận cho
-người — verb đọc trả thẳng đối tượng kết quả, verb ghi trả đúng những
-trường vừa đổi. Đường lỗi KHÔNG bọc phong bì: chẩn đoán đi `stderr`, thành/
-bại phân biệt bằng **exit code**, không bao giờ bằng nội dung chuỗi.
-
-**`fgos.mjs` in đúng một dòng phong bì mỗi lời gọi** (một-shot, nên in
-nhiều dòng cho dễ đọc). **`fgos-runner` in MỘT phong bì mỗi lượt `--once`
-hoặc mỗi chu kỳ `--watch`, liền một dòng** — vì `--watch` phát nhiều phong
-bì nối tiếp theo thời gian, mỗi cái phải trọn trong đúng một dòng để bên
-đọc tách được cái này với cái kia; con trỏ (dưới) áp dụng cùng lý do.
-
-**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm
-`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd "dòng
-bắt đầu bằng `{`"), vì luồng progress-trace của `fgos-runner` (xem "Ngoại
-lệ có lý do" dưới) có thể tự chứa output của trợ lý bắt đầu bằng `{`.
\ No newline at end of file
+## 3. Output Direction Unified Envelope
\ No newline at end of file
````

## claim_38ad96d62f2c6cf7a639fc24a83c2621

Source: docs/io-contract.md#unheaded-block-8

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-15

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_38ad96d62f2c6cf7a639fc24a83c2621 |
| sourceUnitDigest | 6dcf0faa76d27fed |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-15 |
| claimKind | contract |
| disposition | merge |
| reviewStatus | pending |
| rationale | First paragraph of the envelope statement (every successful verb in both binaries prints the fgos.v1 envelope), carried verbatim under Envelope Shape; the same four-field envelope is stated by work-state.md 622-634 in the preceding block (map section 6). |
| targetUnitDigest | 6dcf0faa76d27fed777c0586dad2b3b7 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
Mọi verb thành công (ở CẢ HAI binary — `fgos.mjs` và, từ lát 2,
`fgos-runner.mjs`'s dòng kết-cục cuối) in một phong bì chuẩn `fgos.v1` ra
`stdout`:
```

### Target unit

```text
Mọi verb thành công (ở CẢ HAI binary — `fgos.mjs` và, từ lát 2,
`fgos-runner.mjs`'s dòng kết-cục cuối) in một phong bì chuẩn `fgos.v1` ra
`stdout`:
```

### Unified diff

```diff
No text difference.
```

## claim_dc506074dcc2f08f6012ebb078b50371

Source: docs/io-contract.md#unheaded-block-9

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-16

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_dc506074dcc2f08f6012ebb078b50371 |
| sourceUnitDigest | 18c5d821a55d3517 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-16 |
| claimKind | contract |
| disposition | merge |
| reviewStatus | pending |
| rationale | The fenced envelope shape { contract: 'fgos.v1', generated\_at, data\_hash, data }, carried verbatim as its own block in Envelope Shape; the work-state.md envelope text under the same heading describes the same four fields. Note: the mechanical suggestion pointed at README.md and was wrong. |
| targetUnitDigest | 18c5d821a55d3517cf3efe368fb1d34e |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

````text
```
{ contract: 'fgos.v1', generated_at, data_hash, data }
```
````

### Target unit

````text
```
{ contract: 'fgos.v1', generated_at, data_hash, data }
```
````

### Unified diff

```diff
No text difference.
```

## claim_62d31ae4e5abfcf0ab158c0c6a8337ee

Source: docs/io-contract.md#unheaded-block-10

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-17

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_62d31ae4e5abfcf0ab158c0c6a8337ee |
| sourceUnitDigest | 84367855d92bb2e3 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-17 |
| claimKind | contract |
| disposition | merge |
| reviewStatus | pending |
| rationale | The data-is-structured and error-path-not-enveloped paragraph, carried verbatim in Envelope Shape; work-state.md 622-634 states the same (the ws error-path claim 636-639 also lands in the next H3). |
| targetUnitDigest | 84367855d92bb2e3914cb9bc385c2dce |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
`data` có cấu trúc (trường tên rõ nghĩa), không phải câu xác nhận cho
người — verb đọc trả thẳng đối tượng kết quả, verb ghi trả đúng những
trường vừa đổi. Đường lỗi KHÔNG bọc phong bì: chẩn đoán đi `stderr`, thành/
bại phân biệt bằng **exit code**, không bao giờ bằng nội dung chuỗi.
```

### Target unit

```text
`data` có cấu trúc (trường tên rõ nghĩa), không phải câu xác nhận cho
người — verb đọc trả thẳng đối tượng kết quả, verb ghi trả đúng những
trường vừa đổi. Đường lỗi KHÔNG bọc phong bì: chẩn đoán đi `stderr`, thành/
bại phân biệt bằng **exit code**, không bao giờ bằng nội dung chuỗi.
```

### Unified diff

```diff
No text difference.
```

## claim_5e282fb457ff9ef02e88cf329556cf34

Source: docs/io-contract.md#unheaded-block-11

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-20

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_5e282fb457ff9ef02e88cf329556cf34 |
| sourceUnitDigest | 6a5b9a01b0427971 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-20 |
| claimKind | contract |
| disposition | merge |
| reviewStatus | pending |
| rationale | One envelope per call for fgos.mjs and one single-line envelope per --once/--watch cycle for fgos-runner, carried verbatim under Runner Stdout Envelope; duplicate of work-state.md 641-645 (map section 6). |
| targetUnitDigest | 6a5b9a01b04279716a3d504e251d1de1 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
**`fgos.mjs` in đúng một dòng phong bì mỗi lời gọi** (một-shot, nên in
nhiều dòng cho dễ đọc). **`fgos-runner` in MỘT phong bì mỗi lượt `--once`
hoặc mỗi chu kỳ `--watch`, liền một dòng** — vì `--watch` phát nhiều phong
bì nối tiếp theo thời gian, mỗi cái phải trọn trong đúng một dòng để bên
đọc tách được cái này với cái kia; con trỏ (dưới) áp dụng cùng lý do.
```

### Target unit

```text
**`fgos.mjs` in đúng một dòng phong bì mỗi lời gọi** (một-shot, nên in
nhiều dòng cho dễ đọc). **`fgos-runner` in MỘT phong bì mỗi lượt `--once`
hoặc mỗi chu kỳ `--watch`, liền một dòng** — vì `--watch` phát nhiều phong
bì nối tiếp theo thời gian, mỗi cái phải trọn trong đúng một dòng để bên
đọc tách được cái này với cái kia; con trỏ (dưới) áp dụng cùng lý do.
```

### Unified diff

```diff
No text difference.
```

## claim_5b930b5ce84afec3d4b2c383c7f85925

Source: docs/io-contract.md#unheaded-block-12

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-21

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_5b930b5ce84afec3d4b2c383c7f85925 |
| sourceUnitDigest | bdeca0144b587f82 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-21 |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | Real-envelope recognition rule (parse JSON, check contract === 'fgos.v1', never a text heuristic) carried verbatim under the new H3 Recognizing A Real Envelope; no counterpart in work-state.md. |
| targetUnitDigest | bdeca0144b587f826ce46ea61d3be2e8 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm
`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd "dòng
bắt đầu bằng `{`"), vì luồng progress-trace của `fgos-runner` (xem "Ngoại
lệ có lý do" dưới) có thể tự chứa output của trợ lý bắt đầu bằng `{`.
```

### Target unit

```text
**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm
`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd "dòng
bắt đầu bằng `{`"), vì luồng progress-trace của `fgos-runner` (xem "Ngoại
lệ có lý do" dưới) có thể tự chứa output của trợ lý bắt đầu bằng `{`.
```

### Unified diff

```diff
No text difference.
```

## claim_f50b3640275fce5d0a7e8d4f4077c0c9

Source: docs/io-contract.md#mã-thoát-exit-code-một-nguồn-duy-nhất

Target: docs/platform/work-state/contracts/cli-io-contract.md#4-exit-codes

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f50b3640275fce5d0a7e8d4f4077c0c9 |
| sourceUnitDigest | 3f95d2bd43575ae5 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | 4-exit-codes |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | H3 'Mã thoát (exit code) — một nguồn duy nhất' becomes the H2 '4. Exit Codes' in the frozen layout (level and title changed, single-source claim kept in the body). |
| targetUnitDigest | 36cd92b838deaea9ab436d4ea4f625f0 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
### Mã thoát (exit code) — một nguồn duy nhất

`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·
4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail ·
9 merge-fail) cộng `src/runner/loop.mjs`'s `EXIT_BUSY` (6, riêng của
runner) là bảng DUY NHẤT. 0 = ok, 1 = bất ngờ (mọi thứ chưa phân loại).
Consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp.
```

### Target unit

```text
## 4. Exit Codes

`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·
4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail ·
9 merge-fail) cộng `src/runner/loop.mjs`'s `EXIT_BUSY` (6, riêng của
runner) là bảng DUY NHẤT. 0 = ok, 1 = bất ngờ (mọi thứ chưa phân loại).
Consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp.
```

### Unified diff

```diff
--- "docs/io-contract.md#mã-thoát-exit-code-một-nguồn-duy-nhất"
+++ "docs/platform/work-state/contracts/cli-io-contract.md#4-exit-codes"
@@ -1,4 +1,4 @@
-### Mã thoát (exit code) — một nguồn duy nhất
+## 4. Exit Codes
 
 `src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·
 4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail ·
```

## claim_2fa062c56cf4226e8519e768a5b5cab4

Source: docs/io-contract.md#unheaded-block-13

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-22

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_2fa062c56cf4226e8519e768a5b5cab4 |
| sourceUnitDigest | 3727b3fa0ee79f8b |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-22 |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | EXIT\_CODES table plus EXIT\_BUSY (6) as the only exit-code table, branch on category not message, carried verbatim under 4. Exit Codes. |
| targetUnitDigest | 3727b3fa0ee79f8b0b38d0e9fc868e33 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·
4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail ·
9 merge-fail) cộng `src/runner/loop.mjs`'s `EXIT_BUSY` (6, riêng của
runner) là bảng DUY NHẤT. 0 = ok, 1 = bất ngờ (mọi thứ chưa phân loại).
Consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp.
```

### Target unit

```text
`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·
4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail ·
9 merge-fail) cộng `src/runner/loop.mjs`'s `EXIT_BUSY` (6, riêng của
runner) là bảng DUY NHẤT. 0 = ok, 1 = bất ngờ (mọi thứ chưa phân loại).
Consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp.
```

### Unified diff

```diff
No text difference.
```

## claim_27d4d4dca46d6a8859628c443df0b31e

Source: docs/io-contract.md#phân-trang-con-trỏ-đục

Target: docs/platform/work-state/contracts/cli-io-contract.md#6-cursor-pagination

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_27d4d4dca46d6a8859628c443df0b31e |
| sourceUnitDigest | 413cdab72d47c625 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | 6-cursor-pagination |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | H3 'Phân trang — con trỏ đục' becomes the H2 '6. Cursor Pagination'; title language and level change only. |
| targetUnitDigest | 302bf7838a49e51804feb94da762bf7a |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
### Phân trang — con trỏ đục

Bốn verb trả tập có thể lớn tuỳ dữ liệu mang phân trang tuỳ chọn:
`ready` · `triage` · `evolve` (lượt liệt-kê không cờ) · `list`'s khoá
`work`. Không truyền `--cursor`/`--limit` → kết quả đầy đủ, y hệt không có
tính năng này. Truyền một trong hai → kết quả đổi hình dạng thành
`{items, nextCursor}`. Con trỏ là một chuỗi đục hoàn toàn — sinh bởi máy
chủ, người gọi chỉ trả lại nguyên văn, không bao giờ tự phân tích hay tự
chế. `nextCursor` là `null` khi đã tới cuối tập. Một con trỏ trỏ tới mục đã
rời tập là lỗi phạm trù `validation`, thông điệp tự nêu cách sửa (bắt đầu
lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang — mỗi dòng của
nó là một cặp `(a,b)`, không có khoá riêng cho một dòng.

Sổ verb tự khai verb nào phân trang qua trường `paginated` (đúng/sai, mặt
trên MỌI verb).
```

### Target unit

```text
## 6. Cursor Pagination

**Phân trang cho verb trả tập lớn (per str46-io-contract, được tsk-483 mở lại — xem `docs/history/tsk-483-list-side-log-pagination-
scoping/CONTEXT.md`).** Sổ verb khai thêm cờ `paginated` (đúng/sai) cho
MỌI verb — chỉ bốn verb mang `paginated: true`: `ready`, `triage`,
`evolve` (lượt liệt-kê không cờ của nó), và khoá `work` của `list`. Bốn
verb này nhận thêm hai tham số tuỳ chọn `--cursor`/`--limit`: không
truyền cờ nào → kết quả y hệt hôm nay (mảng/map đầy đủ, không đổi hình
dạng) — NGOẠI LỆ DUY NHẤT: `list --all --json` không kèm `--cursor`/
`--limit` giữ nguyên hình dạng thô này VĨNH VIỄN, vì `packages/herdr-fgos-common/rust/src/
fgos.rs` (crate Rust ngoài repo Node này) đọc đúng lời gọi đó làm hợp
đồng công khai. Mọi tổ hợp KHÁC của `list` (mặc định trần không cờ nào,
`--id`, hoặc bất kỳ tổ hợp nào có `--cursor`/`--limit` — kể cả kèm
`--all`) đều thu hẹp `decisions`/`discovery`/`gates`/`settlements`/
`outcomes`/`frictions`/`learnings`/`decisionsById` xuống đúng tập id đang
thật sự được trả trong `work` — `tools` (khoá theo TÊN công cụ, không
theo id việc) không bao giờ bị đụng tới. Với ba verb còn lại (`ready`/
`triage`/`evolve`), truyền một trong hai `--cursor`/`--limit` → kết quả
đổi hình dạng thành `{items, nextCursor}`. Con trỏ (`cursor`) là **đục
hoàn toàn** —
người gọi chỉ nhận lại nguyên văn từ `nextCursor` của lượt trước rồi truyền
tiếp, không bao giờ tự phân tích hay tự chế. `nextCursor` là `null` khi đã
tới cuối tập. Một con trỏ trỏ tới một mục đã rời tập (vd việc đã `done` từ
lượt trước) là lỗi phạm trù `validation` — thông điệp lỗi tự nêu cách sửa
(bắt đầu lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang
(`paginated: false`, lý do ghi ngay trong mô tả verb) — mỗi dòng của nó là
một cặp `(a,b)`, không có khoá riêng cho một dòng để làm mốc con trỏ.

Bốn verb trả tập có thể lớn tuỳ dữ liệu mang phân trang tuỳ chọn:
`ready` · `triage` · `evolve` (lượt liệt-kê không cờ) · `list`'s khoá
`work`. Không truyền `--cursor`/`--limit` → kết quả đầy đủ, y hệt không có
tính năng này. Truyền một trong hai → kết quả đổi hình dạng thành
`{items, nextCursor}`. Con trỏ là một chuỗi đục hoàn toàn — sinh bởi máy
chủ, người gọi chỉ trả lại nguyên văn, không bao giờ tự phân tích hay tự
chế. `nextCursor` là `null` khi đã tới cuối tập. Một con trỏ trỏ tới mục đã
rời tập là lỗi phạm trù `validation`, thông điệp tự nêu cách sửa (bắt đầu
lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang — mỗi dòng của
nó là một cặp `(a,b)`, không có khoá riêng cho một dòng.

Sổ verb tự khai verb nào phân trang qua trường `paginated` (đúng/sai, mặt
trên MỌI verb).
```

### Unified diff

```diff
--- "docs/io-contract.md#phân-trang-con-trỏ-đục"
+++ "docs/platform/work-state/contracts/cli-io-contract.md#6-cursor-pagination"
@@ -1,4 +1,30 @@
-### Phân trang — con trỏ đục
+## 6. Cursor Pagination
+
+**Phân trang cho verb trả tập lớn (per str46-io-contract, được tsk-483 mở lại — xem `docs/history/tsk-483-list-side-log-pagination-
+scoping/CONTEXT.md`).** Sổ verb khai thêm cờ `paginated` (đúng/sai) cho
+MỌI verb — chỉ bốn verb mang `paginated: true`: `ready`, `triage`,
+`evolve` (lượt liệt-kê không cờ của nó), và khoá `work` của `list`. Bốn
+verb này nhận thêm hai tham số tuỳ chọn `--cursor`/`--limit`: không
+truyền cờ nào → kết quả y hệt hôm nay (mảng/map đầy đủ, không đổi hình
+dạng) — NGOẠI LỆ DUY NHẤT: `list --all --json` không kèm `--cursor`/
+`--limit` giữ nguyên hình dạng thô này VĨNH VIỄN, vì `packages/herdr-fgos-common/rust/src/
+fgos.rs` (crate Rust ngoài repo Node này) đọc đúng lời gọi đó làm hợp
+đồng công khai. Mọi tổ hợp KHÁC của `list` (mặc định trần không cờ nào,
+`--id`, hoặc bất kỳ tổ hợp nào có `--cursor`/`--limit` — kể cả kèm
+`--all`) đều thu hẹp `decisions`/`discovery`/`gates`/`settlements`/
+`outcomes`/`frictions`/`learnings`/`decisionsById` xuống đúng tập id đang
+thật sự được trả trong `work` — `tools` (khoá theo TÊN công cụ, không
+theo id việc) không bao giờ bị đụng tới. Với ba verb còn lại (`ready`/
+`triage`/`evolve`), truyền một trong hai `--cursor`/`--limit` → kết quả
+đổi hình dạng thành `{items, nextCursor}`. Con trỏ (`cursor`) là **đục
+hoàn toàn** —
+người gọi chỉ nhận lại nguyên văn từ `nextCursor` của lượt trước rồi truyền
+tiếp, không bao giờ tự phân tích hay tự chế. `nextCursor` là `null` khi đã
+tới cuối tập. Một con trỏ trỏ tới một mục đã rời tập (vd việc đã `done` từ
+lượt trước) là lỗi phạm trù `validation` — thông điệp lỗi tự nêu cách sửa
+(bắt đầu lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang
+(`paginated: false`, lý do ghi ngay trong mô tả verb) — mỗi dòng của nó là
+một cặp `(a,b)`, không có khoá riêng cho một dòng để làm mốc con trỏ.
 
 Bốn verb trả tập có thể lớn tuỳ dữ liệu mang phân trang tuỳ chọn:
 `ready` · `triage` · `evolve` (lượt liệt-kê không cờ) · `list`'s khoá
```

## claim_da21278ab32966f6631c82420552ed2b

Source: docs/io-contract.md#unheaded-block-16

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-27

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_da21278ab32966f6631c82420552ed2b |
| sourceUnitDigest | c34e8e9c9dbf41ce |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-27 |
| claimKind | contract |
| disposition | merge |
| reviewStatus | pending |
| rationale | Opaque-cursor paragraph (four paginated verbs, {items, nextCursor}, validation error for a departed item, conflicts not paginated) carried verbatim; it is a strict subset of the longer work-state.md 678-702 paragraph held in the preceding block under the same heading (map section 6). |
| targetUnitDigest | c34e8e9c9dbf41ceba76b86cd175dcb8 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
Bốn verb trả tập có thể lớn tuỳ dữ liệu mang phân trang tuỳ chọn:
`ready` · `triage` · `evolve` (lượt liệt-kê không cờ) · `list`'s khoá
`work`. Không truyền `--cursor`/`--limit` → kết quả đầy đủ, y hệt không có
tính năng này. Truyền một trong hai → kết quả đổi hình dạng thành
`{items, nextCursor}`. Con trỏ là một chuỗi đục hoàn toàn — sinh bởi máy
chủ, người gọi chỉ trả lại nguyên văn, không bao giờ tự phân tích hay tự
chế. `nextCursor` là `null` khi đã tới cuối tập. Một con trỏ trỏ tới mục đã
rời tập là lỗi phạm trù `validation`, thông điệp tự nêu cách sửa (bắt đầu
lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang — mỗi dòng của
nó là một cặp `(a,b)`, không có khoá riêng cho một dòng.
```

### Target unit

```text
Bốn verb trả tập có thể lớn tuỳ dữ liệu mang phân trang tuỳ chọn:
`ready` · `triage` · `evolve` (lượt liệt-kê không cờ) · `list`'s khoá
`work`. Không truyền `--cursor`/`--limit` → kết quả đầy đủ, y hệt không có
tính năng này. Truyền một trong hai → kết quả đổi hình dạng thành
`{items, nextCursor}`. Con trỏ là một chuỗi đục hoàn toàn — sinh bởi máy
chủ, người gọi chỉ trả lại nguyên văn, không bao giờ tự phân tích hay tự
chế. `nextCursor` là `null` khi đã tới cuối tập. Một con trỏ trỏ tới mục đã
rời tập là lỗi phạm trù `validation`, thông điệp tự nêu cách sửa (bắt đầu
lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang — mỗi dòng của
nó là một cặp `(a,b)`, không có khoá riêng cho một dòng.
```

### Unified diff

```diff
No text difference.
```

## claim_b38e730cc466114aa1e1ebba6fa880ed

Source: docs/io-contract.md#unheaded-block-17

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-28

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_b38e730cc466114aa1e1ebba6fa880ed |
| sourceUnitDigest | b82a558166f118f3 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-28 |
| claimKind | contract |
| disposition | merge |
| reviewStatus | pending |
| rationale | The paginated field is declared on every verb in the manifest; carried verbatim as the last block of 6. Cursor Pagination, where the work-state.md paragraph also states the paginated flag. |
| targetUnitDigest | b82a558166f118f339210d9a47521404 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
Sổ verb tự khai verb nào phân trang qua trường `paginated` (đúng/sai, mặt
trên MỌI verb).
```

### Target unit

```text
Sổ verb tự khai verb nào phân trang qua trường `paginated` (đúng/sai, mặt
trên MỌI verb).
```

### Unified diff

```diff
No text difference.
```

## claim_fda67d0dfc15159dc0e4c62b9dfddd87

Source: docs/io-contract.md#sổ-verb-máy-đọc-cli-tự-mô-tả

Target: docs/platform/work-state/contracts/cli-io-contract.md#7-machine-readable-verb-registry

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_fda67d0dfc15159dc0e4c62b9dfddd87 |
| sourceUnitDigest | 07e9c25f094955f0 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | 7-machine-readable-verb-registry |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | H2 'Sổ verb máy-đọc — CLI tự mô tả' maps to '7. Machine-Readable Verb Registry'; title language and numbering differ. |
| targetUnitDigest | 4af102d0a390692f1d71ae14123acf45 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
## Sổ verb máy-đọc — CLI tự mô tả

`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố
toàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest
thay vì hard-code từng verb. `schema_version` hiện `'2.0'` (tăng từ `'1.0'`
vì trường `access` bị xoá). Mỗi mục verb mang:

- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`
  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata
  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).
- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và
  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục
  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,
  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù
  bản thân `review` không hề ghi trạng thái). Xem `fgos --help --json` cho
  danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`,
  `coordination` — dispatch executor thật tính là effect ngoài `.fgos/`).
- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.

Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa
nối vào điều phối hay xác danh; cổng "ai được nói verb nào" thuộc STR38.
```

### Target unit

```text
## 7. Machine-Readable Verb Registry
```

### Unified diff

```diff
--- "docs/io-contract.md#sổ-verb-máy-đọc-cli-tự-mô-tả"
+++ "docs/platform/work-state/contracts/cli-io-contract.md#7-machine-readable-verb-registry"
@@ -1,21 +1 @@
-## Sổ verb máy-đọc — CLI tự mô tả
-
-`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố
-toàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest
-thay vì hard-code từng verb. `schema_version` hiện `'2.0'` (tăng từ `'1.0'`
-vì trường `access` bị xoá). Mỗi mục verb mang:
-
-- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`
-  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata
-  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).
-- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và
-  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục
-  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,
-  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù
-  bản thân `review` không hề ghi trạng thái). Xem `fgos --help --json` cho
-  danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`,
-  `coordination` — dispatch executor thật tính là effect ngoài `.fgos/`).
-- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.
-
-Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa
-nối vào điều phối hay xác danh; cổng "ai được nói verb nào" thuộc STR38.
\ No newline at end of file
+## 7. Machine-Readable Verb Registry
\ No newline at end of file
```

## claim_19495d2772ced1aa1af4b20d4640fa3a

Source: docs/io-contract.md#unheaded-block-18

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-30

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_19495d2772ced1aa1af4b20d4640fa3a |
| sourceUnitDigest | 83773dda67db8d5f |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-30 |
| claimKind | contract |
| disposition | merge |
| reviewStatus | pending |
| rationale | fgos --help --json returns {schema\_version, commands}, schema\_version 2.0 raised from 1.0 because access was removed; carried verbatim under Manifest Shape, duplicating the manifest claim of work-state.md 647-663 (which adds the positional-parameter rule). |
| targetUnitDigest | 83773dda67db8d5f71205bb8c7106186 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố
toàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest
thay vì hard-code từng verb. `schema_version` hiện `'2.0'` (tăng từ `'1.0'`
vì trường `access` bị xoá). Mỗi mục verb mang:
```

### Target unit

```text
`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố
toàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest
thay vì hard-code từng verb. `schema_version` hiện `'2.0'` (tăng từ `'1.0'`
vì trường `access` bị xoá). Mỗi mục verb mang:
```

### Unified diff

```diff
No text difference.
```

## claim_e2377849e4ba8e3d3beaf70880e4ed23

Source: docs/io-contract.md#unheaded-block-19

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_e2377849e4ba8e3d3beaf70880e4ed23 |
| sourceUnitDigest | 39e4ab1f30a6acc9 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-32 |
| claimKind | contract |
| disposition | merge |
| reviewStatus | pending |
| rationale | Per-entry fields list with touchesState and externalEffect axes and the externalEffect examples review, approve, coordination; carried verbatim under Entry Fields And Effect Axes alongside the work-state.md 665-676 text. This io wording is the one the frozen map keeps (the ws exclusive list is the superseded side), but the coordination example is stale (COMMAND\_REGISTRY marks 15 verbs and coordination is not among them) and is carried as written. OPEN SEMANTIC CONFLICT: the carried \`coordination\` example (and the exclusive "only review and approve" claim of the other source) contradicts the code, which marks 15 verbs \`externalEffect: true\` and not \`coordination\`; the row stays pending until the owner resolves the conflict (see semantic-conflicts.md). |
| targetUnitDigest | 39e4ab1f30a6acc99de534a9fd16bd34 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`
  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata
  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).
- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và
  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục
  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,
  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù
  bản thân `review` không hề ghi trạng thái). Xem `fgos --help --json` cho
  danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`,
  `coordination` — dispatch executor thật tính là effect ngoài `.fgos/`).
- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.
```

### Target unit

```text
- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`
  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata
  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).
- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và
  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục
  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,
  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù
  bản thân `review` không hề ghi trạng thái). Xem `fgos --help --json` cho
  danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`,
  `coordination` — dispatch executor thật tính là effect ngoài `.fgos/`).
- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.
```

### Unified diff

```diff
No text difference.
```

## claim_535f1aeb31d616e2138a5b3719cb4cd0

Source: docs/io-contract.md#unheaded-block-20

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-33

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_535f1aeb31d616e2138a5b3719cb4cd0 |
| sourceUnitDigest | 78393c0183b6bda3 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-33 |
| claimKind | contract |
| disposition | merge |
| reviewStatus | pending |
| rationale | Both axes remain declarative only; the who-may-call-which-verb gate belongs to STR38. Carried verbatim under Entry Fields And Effect Axes, where work-state.md 665-676 states the same declarative-only point. |
| targetUnitDigest | 78393c0183b6bda3ff166520f4601ab2 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa
nối vào điều phối hay xác danh; cổng "ai được nói verb nào" thuộc STR38.
```

### Target unit

```text
Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa
nối vào điều phối hay xác danh; cổng "ai được nói verb nào" thuộc STR38.
```

### Unified diff

```diff
No text difference.
```

## claim_ba1c2ac95c9c161d9fd345e3bfa63741

Source: docs/io-contract.md#quy-ước-cờ-nhiều-giá-trị

Target: docs/platform/work-state/contracts/cli-io-contract.md#8-multi-value-flag-convention

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_ba1c2ac95c9c161d9fd345e3bfa63741 |
| sourceUnitDigest | 1a437d176164754d |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | 8-multi-value-flag-convention |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | H3 'Quy ước cờ nhiều-giá-trị' becomes the H2 '8. Multi-Value Flag Convention'; title language and level change only. |
| targetUnitDigest | 3e7cfb35e58461211cd5f01de9abfc2e |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
### Quy ước cờ nhiều-giá-trị

Tham số nào mang nhiều giá trị khai `multiValueFormat`: `'csv'` (phân tách
dấu phẩy — `deps`/`refs`/`footprint`/`targets`) hay `'json-array'` (chuỗi
JSON-hoá — `acceptance`, CỐ Ý không phẩy vì văn bản một clause có thể tự
chứa dấu phẩy). Trước STR46, khác biệt này chỉ nằm trong văn xuôi mô tả;
nay đọc được bằng máy.
```

### Target unit

```text
## 8. Multi-Value Flag Convention

**Quy ước cờ nhiều-giá-trị (per str46-io-contract).** Sổ verb khai thêm
trường `multiValueFormat` (`'csv'` hay `'json-array'`) trên đúng những tham
số nào mang nhiều giá trị — trước đây khác biệt này chỉ nằm trong văn xuôi
mô tả, không đọc được bằng máy. `deps`, `refs`, `footprint`, `targets` mang
`multiValueFormat: 'csv'` (phân tách bằng dấu phẩy). `acceptance` mang
`multiValueFormat: 'json-array'` (chuỗi JSON-hoá, CỐ Ý không phẩy vì văn
bản một clause có thể tự chứa dấu phẩy). Tham số không mang nhiều giá trị
không có trường này.

Tham số nào mang nhiều giá trị khai `multiValueFormat`: `'csv'` (phân tách
dấu phẩy — `deps`/`refs`/`footprint`/`targets`) hay `'json-array'` (chuỗi
JSON-hoá — `acceptance`, CỐ Ý không phẩy vì văn bản một clause có thể tự
chứa dấu phẩy). Trước STR46, khác biệt này chỉ nằm trong văn xuôi mô tả;
nay đọc được bằng máy.
```

### Unified diff

```diff
--- "docs/io-contract.md#quy-ước-cờ-nhiều-giá-trị"
+++ "docs/platform/work-state/contracts/cli-io-contract.md#8-multi-value-flag-convention"
@@ -1,4 +1,13 @@
-### Quy ước cờ nhiều-giá-trị
+## 8. Multi-Value Flag Convention
+
+**Quy ước cờ nhiều-giá-trị (per str46-io-contract).** Sổ verb khai thêm
+trường `multiValueFormat` (`'csv'` hay `'json-array'`) trên đúng những tham
+số nào mang nhiều giá trị — trước đây khác biệt này chỉ nằm trong văn xuôi
+mô tả, không đọc được bằng máy. `deps`, `refs`, `footprint`, `targets` mang
+`multiValueFormat: 'csv'` (phân tách bằng dấu phẩy). `acceptance` mang
+`multiValueFormat: 'json-array'` (chuỗi JSON-hoá, CỐ Ý không phẩy vì văn
+bản một clause có thể tự chứa dấu phẩy). Tham số không mang nhiều giá trị
+không có trường này.
 
 Tham số nào mang nhiều giá trị khai `multiValueFormat`: `'csv'` (phân tách
 dấu phẩy — `deps`/`refs`/`footprint`/`targets`) hay `'json-array'` (chuỗi
```

## claim_d0e16d088cdecf2dd0b491f819009aa6

Source: docs/io-contract.md#unheaded-block-21

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-35

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_d0e16d088cdecf2dd0b491f819009aa6 |
| sourceUnitDigest | a8eaefe3669a194a |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-35 |
| claimKind | contract |
| disposition | merge |
| reviewStatus | pending |
| rationale | multiValueFormat csv vs json-array convention (deps/refs/footprint/targets vs acceptance), carried verbatim under 8. Multi-Value Flag Convention; duplicate of work-state.md 704-711 held in the preceding block. |
| targetUnitDigest | a8eaefe3669a194a9fa84ca8fa92d4d5 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
Tham số nào mang nhiều giá trị khai `multiValueFormat`: `'csv'` (phân tách
dấu phẩy — `deps`/`refs`/`footprint`/`targets`) hay `'json-array'` (chuỗi
JSON-hoá — `acceptance`, CỐ Ý không phẩy vì văn bản một clause có thể tự
chứa dấu phẩy). Trước STR46, khác biệt này chỉ nằm trong văn xuôi mô tả;
nay đọc được bằng máy.
```

### Target unit

```text
Tham số nào mang nhiều giá trị khai `multiValueFormat`: `'csv'` (phân tách
dấu phẩy — `deps`/`refs`/`footprint`/`targets`) hay `'json-array'` (chuỗi
JSON-hoá — `acceptance`, CỐ Ý không phẩy vì văn bản một clause có thể tự
chứa dấu phẩy). Trước STR46, khác biệt này chỉ nằm trong văn xuôi mô tả;
nay đọc được bằng máy.
```

### Unified diff

```diff
No text difference.
```

## claim_6c529b87f6073cc75fdf836d3507d21d

Source: docs/io-contract.md#version-token

Target: docs/platform/work-state/contracts/cli-io-contract.md#10-version-tokens

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_6c529b87f6073cc75fdf836d3507d21d |
| sourceUnitDigest | a1b267899ca12fa9 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | 10-version-tokens |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | H2 'Version token' maps to '10. Version Tokens' (section 9 Per-Verb Help sits between, owned only by work-state.md); only title language and numbering differ. |
| targetUnitDigest | 934cee435d2ab0ff2f52c0731e412fd7 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
## Version token

Theo [0011](decisions/0011-version-tuong-minh-cho-moi-contract.md): mỗi
contract mang version tường minh trong định danh của chính nó.

| Bề mặt | Token | Hiện thân |
|---|---|---|
| Phong bì CLI (CTR001) | `fgos.v1` | field `contract` trên mọi phong bì, cả hai binary |
| Stdout của `fgos-runner` (CTR003, riêng phần bề mặt ra) | dùng lại `fgos.v1` | KHÔNG đúc token CTR003 riêng — bề mặt này tái dùng đúng cơ chế `fgos.v1` của CTR001 |
| Sổ verb (manifest) | `2.0` | field `schema_version` trong `{schema_version, commands[]}` |
| Sự kiện (event log) | `3` | field `v` trên mỗi event, `SCHEMA_VERSION` (`work.mjs`) |
| `gates[id]` (ask/answer, CTR004) | `CTR004/v1` | hiện thân qua `SCHEMA_VERSION` của sự kiện `work.move` nó fold ra — KHÔNG một field version riêng (thêm field thứ hai cho cùng dữ liệu phá DRY) |

CTR006 (routing-handoff) nằm NGOÀI: nó là spec đầy đủ nhưng chưa có code,
dán version lên thứ chưa chạy là đóng dấu cho giả định.
```

### Target unit

```text
## 10. Version Tokens

Theo [0011](../decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract): mỗi
contract mang version tường minh trong định danh của chính nó.

| Bề mặt | Token | Hiện thân |
|---|---|---|
| Phong bì CLI (CTR001) | `fgos.v1` | field `contract` trên mọi phong bì, cả hai binary |
| Stdout của `fgos-runner` (CTR003, riêng phần bề mặt ra) | dùng lại `fgos.v1` | KHÔNG đúc token CTR003 riêng — bề mặt này tái dùng đúng cơ chế `fgos.v1` của CTR001 |
| Sổ verb (manifest) | `2.0` | field `schema_version` trong `{schema_version, commands[]}` |
| Sự kiện (event log) | `3` | field `v` trên mỗi event, `SCHEMA_VERSION` (`work.mjs`) |
| `gates[id]` (ask/answer, CTR004) | `CTR004/v1` | hiện thân qua `SCHEMA_VERSION` của sự kiện `work.move` nó fold ra — KHÔNG một field version riêng (thêm field thứ hai cho cùng dữ liệu phá DRY) |

CTR006 (routing-handoff) nằm NGOÀI: nó là spec đầy đủ nhưng chưa có code,
dán version lên thứ chưa chạy là đóng dấu cho giả định.
```

### Unified diff

```diff
--- "docs/io-contract.md#version-token"
+++ "docs/platform/work-state/contracts/cli-io-contract.md#10-version-tokens"
@@ -1,6 +1,6 @@
-## Version token
+## 10. Version Tokens
 
-Theo [0011](decisions/0011-version-tuong-minh-cho-moi-contract.md): mỗi
+Theo [0011](../decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract): mỗi
 contract mang version tường minh trong định danh của chính nó.
 
 | Bề mặt | Token | Hiện thân |
```

## claim_e9ee744c6e1847ef25b3eb0bf180f577

Source: docs/io-contract.md#unheaded-block-22

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-38

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_e9ee744c6e1847ef25b3eb0bf180f577 |
| sourceUnitDigest | ae0e60ec193e0ac5 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-38 |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | Version-token lead sentence carried into 10. Version Tokens, but CHANGED in the link: the 0011 link decisions/0011-version-tuong-minh-cho-moi-contract.md (dead) is repointed to ../decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract; the wording is otherwise verbatim. The located-file match missed it for that reason. |
| targetUnitDigest | a378c81f6a84c5e3ed9b38917f7136c5 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
Theo [0011](decisions/0011-version-tuong-minh-cho-moi-contract.md): mỗi
contract mang version tường minh trong định danh của chính nó.
```

### Target unit

```text
Theo [0011](../decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract): mỗi
contract mang version tường minh trong định danh của chính nó.
```

### Unified diff

```diff
--- "docs/io-contract.md#unheaded-block-22"
+++ "docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-38"
@@ -1,2 +1,2 @@
-Theo [0011](decisions/0011-version-tuong-minh-cho-moi-contract.md): mỗi
+Theo [0011](../decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract): mỗi
 contract mang version tường minh trong định danh của chính nó.
\ No newline at end of file
```

## claim_6f7c99f38f64abb5af7f07c1e2690730

Source: docs/io-contract.md#unheaded-block-23

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-39

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_6f7c99f38f64abb5af7f07c1e2690730 |
| sourceUnitDigest | c9d3ad96d4b03b02 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-39 |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | The five-row version-token table (fgos.v1, runner reuse, manifest 2.0, event v 3, gates CTR004/v1), carried verbatim under 10. Version Tokens. |
| targetUnitDigest | c9d3ad96d4b03b02fbcf8e5bd0261ab7 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
| Bề mặt | Token | Hiện thân |
|---|---|---|
| Phong bì CLI (CTR001) | `fgos.v1` | field `contract` trên mọi phong bì, cả hai binary |
| Stdout của `fgos-runner` (CTR003, riêng phần bề mặt ra) | dùng lại `fgos.v1` | KHÔNG đúc token CTR003 riêng — bề mặt này tái dùng đúng cơ chế `fgos.v1` của CTR001 |
| Sổ verb (manifest) | `2.0` | field `schema_version` trong `{schema_version, commands[]}` |
| Sự kiện (event log) | `3` | field `v` trên mỗi event, `SCHEMA_VERSION` (`work.mjs`) |
| `gates[id]` (ask/answer, CTR004) | `CTR004/v1` | hiện thân qua `SCHEMA_VERSION` của sự kiện `work.move` nó fold ra — KHÔNG một field version riêng (thêm field thứ hai cho cùng dữ liệu phá DRY) |
```

### Target unit

```text
| Bề mặt | Token | Hiện thân |
|---|---|---|
| Phong bì CLI (CTR001) | `fgos.v1` | field `contract` trên mọi phong bì, cả hai binary |
| Stdout của `fgos-runner` (CTR003, riêng phần bề mặt ra) | dùng lại `fgos.v1` | KHÔNG đúc token CTR003 riêng — bề mặt này tái dùng đúng cơ chế `fgos.v1` của CTR001 |
| Sổ verb (manifest) | `2.0` | field `schema_version` trong `{schema_version, commands[]}` |
| Sự kiện (event log) | `3` | field `v` trên mỗi event, `SCHEMA_VERSION` (`work.mjs`) |
| `gates[id]` (ask/answer, CTR004) | `CTR004/v1` | hiện thân qua `SCHEMA_VERSION` của sự kiện `work.move` nó fold ra — KHÔNG một field version riêng (thêm field thứ hai cho cùng dữ liệu phá DRY) |
```

### Unified diff

```diff
No text difference.
```

## claim_ea280fa29dca090fe3306f6161ac6ae7

Source: docs/io-contract.md#unheaded-block-24

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-40

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_ea280fa29dca090fe3306f6161ac6ae7 |
| sourceUnitDigest | 03c9a0137385cea3 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-40 |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | CTR006 routing-handoff is outside the version tokens (full spec but no code yet), carried verbatim. |
| targetUnitDigest | 03c9a0137385cea34764f24cc92708d2 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
CTR006 (routing-handoff) nằm NGOÀI: nó là spec đầy đủ nhưng chưa có code,
dán version lên thứ chưa chạy là đóng dấu cho giả định.
```

### Target unit

```text
CTR006 (routing-handoff) nằm NGOÀI: nó là spec đầy đủ nhưng chưa có code,
dán version lên thứ chưa chạy là đóng dấu cho giả định.
```

### Unified diff

```diff
No text difference.
```

## claim_95a909b7be1252ba8de3be4c15f3638e

Source: docs/io-contract.md#ranh-giới-điều-gì-không-thuộc-hợp-đồng-này

Target: docs/platform/work-state/contracts/cli-io-contract.md#11-scope-boundary

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_95a909b7be1252ba8de3be4c15f3638e |
| sourceUnitDigest | 6e8ef157c4c9861c |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | 11-scope-boundary |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | H2 'Ranh giới — điều gì KHÔNG thuộc hợp đồng này' maps to '11. Scope Boundary'; title language and numbering differ. |
| targetUnitDigest | f57aa1458563f22d63881b3372998ece |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
## Ranh giới — điều gì KHÔNG thuộc hợp đồng này

STR46 hợp nhất chiều vào/ra hôm nay đang có, KHÔNG mở rộng nó thành chủ
động (push). Ba việc sau đã locked ngoài biên khi mở exploring, mỗi việc có
nhà riêng:

- **Chiều-ra khởi-xướng ("cần bạn")** — một kênh attention/push có
  delivery-semantics riêng (at-least-once, dedup, routing, ack,
  escalation) — thuộc STR48, sống ở consumer/daemon, KHÔNG phải core fgOS.
- **Increment terminal/pane + chat item-scoped** — thuộc STR83/STR38.
- **Tầng phân quyền** ("ai được gọi verb nào", caller chưa xác danh có bị
  chặn hay không) — thuộc STR38.

Đây là lý do CoS gốc của STR46 (bản khai lúc mở backlog) bị thu hẹp có chủ
ý: chỉ vế "có một spec hợp đồng in/out tự-mô-tả" là việc của STR46; hai vế
còn lại (chiều-ra khởi-xướng, increment terminal/pane) thuộc PBI khác.

Cũng nằm ngoài: daemon (chưa xây), tách core verb-logic thành lib độc lập
CLI (prerequisite của kiến trúc daemon tương lai, refactor thuần không đổi
hành vi), và khối `fgos-discovered` (giao thức worker→runner, không phải
cửa ra tới người).
```

### Target unit

```text
## 11. Scope Boundary

STR46 hợp nhất chiều vào/ra hôm nay đang có, KHÔNG mở rộng nó thành chủ
động (push). Ba việc sau đã locked ngoài biên khi mở exploring, mỗi việc có
nhà riêng:

- **Chiều-ra khởi-xướng ("cần bạn")** — một kênh attention/push có
  delivery-semantics riêng (at-least-once, dedup, routing, ack,
  escalation) — thuộc STR48, sống ở consumer/daemon, KHÔNG phải core fgOS.
- **Increment terminal/pane + chat item-scoped** — thuộc STR83/STR38.
- **Tầng phân quyền** ("ai được gọi verb nào", caller chưa xác danh có bị
  chặn hay không) — thuộc STR38.

Đây là lý do CoS gốc của STR46 (bản khai lúc mở backlog) bị thu hẹp có chủ
ý: chỉ vế "có một spec hợp đồng in/out tự-mô-tả" là việc của STR46; hai vế
còn lại (chiều-ra khởi-xướng, increment terminal/pane) thuộc PBI khác.

Cũng nằm ngoài: daemon (chưa xây), tách core verb-logic thành lib độc lập
CLI (prerequisite của kiến trúc daemon tương lai, refactor thuần không đổi
hành vi), và khối `fgos-discovered` (giao thức worker→runner, không phải
cửa ra tới người).
```

### Unified diff

```diff
--- "docs/io-contract.md#ranh-giới-điều-gì-không-thuộc-hợp-đồng-này"
+++ "docs/platform/work-state/contracts/cli-io-contract.md#11-scope-boundary"
@@ -1,4 +1,4 @@
-## Ranh giới — điều gì KHÔNG thuộc hợp đồng này
+## 11. Scope Boundary
 
 STR46 hợp nhất chiều vào/ra hôm nay đang có, KHÔNG mở rộng nó thành chủ
 động (push). Ba việc sau đã locked ngoài biên khi mở exploring, mỗi việc có
```

## claim_8999e61e46d6c02b407b84263d7a2d67

Source: docs/io-contract.md#unheaded-block-25

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-41

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_8999e61e46d6c02b407b84263d7a2d67 |
| sourceUnitDigest | 36d44c8bdf5ad1f0 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-41 |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | STR46 unifies existing in/out directions and does not extend to push; three items locked outside the boundary, carried verbatim under 11. Scope Boundary. |
| targetUnitDigest | 36d44c8bdf5ad1f062c83e623e68e7d4 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
STR46 hợp nhất chiều vào/ra hôm nay đang có, KHÔNG mở rộng nó thành chủ
động (push). Ba việc sau đã locked ngoài biên khi mở exploring, mỗi việc có
nhà riêng:
```

### Target unit

```text
STR46 hợp nhất chiều vào/ra hôm nay đang có, KHÔNG mở rộng nó thành chủ
động (push). Ba việc sau đã locked ngoài biên khi mở exploring, mỗi việc có
nhà riêng:
```

### Unified diff

```diff
No text difference.
```

## claim_f10fba22a20755dc700bb1720f98f451

Source: docs/io-contract.md#unheaded-block-26

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-42

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f10fba22a20755dc700bb1720f98f451 |
| sourceUnitDigest | fa405ec4333b4351 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-42 |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | Three out-of-scope bullets with named owners (STR48 initiating output, STR83/STR38 terminal/chat increment, STR38 permission layer), carried verbatim; a contract boundary obligation. |
| targetUnitDigest | fa405ec4333b43518de9831ea52cd472 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
- **Chiều-ra khởi-xướng ("cần bạn")** — một kênh attention/push có
  delivery-semantics riêng (at-least-once, dedup, routing, ack,
  escalation) — thuộc STR48, sống ở consumer/daemon, KHÔNG phải core fgOS.
- **Increment terminal/pane + chat item-scoped** — thuộc STR83/STR38.
- **Tầng phân quyền** ("ai được gọi verb nào", caller chưa xác danh có bị
  chặn hay không) — thuộc STR38.
```

### Target unit

```text
- **Chiều-ra khởi-xướng ("cần bạn")** — một kênh attention/push có
  delivery-semantics riêng (at-least-once, dedup, routing, ack,
  escalation) — thuộc STR48, sống ở consumer/daemon, KHÔNG phải core fgOS.
- **Increment terminal/pane + chat item-scoped** — thuộc STR83/STR38.
- **Tầng phân quyền** ("ai được gọi verb nào", caller chưa xác danh có bị
  chặn hay không) — thuộc STR38.
```

### Unified diff

```diff
No text difference.
```

## claim_cf56f4a8b7679435c6bf59abd8c23093

Source: docs/io-contract.md#unheaded-block-27

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-43

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_cf56f4a8b7679435c6bf59abd8c23093 |
| sourceUnitDigest | 30a3d1465b852976 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-43 |
| claimKind | historical-context |
| disposition | promote |
| reviewStatus | pending |
| rationale | Explains why the original STR46 close-of-story (written when the backlog item opened) was deliberately narrowed to the spec-contract part: provenance of a past scope decision, not a normative obligation, so historical-context per the vocabulary (provenance / retired context). Text carried verbatim under 11. Scope Boundary; owner and anchor unchanged because the candidate keeps it there as part of the boundary section. |
| targetUnitDigest | 30a3d1465b852976e30a3aad9f6729d1 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
Đây là lý do CoS gốc của STR46 (bản khai lúc mở backlog) bị thu hẹp có chủ
ý: chỉ vế "có một spec hợp đồng in/out tự-mô-tả" là việc của STR46; hai vế
còn lại (chiều-ra khởi-xướng, increment terminal/pane) thuộc PBI khác.
```

### Target unit

```text
Đây là lý do CoS gốc của STR46 (bản khai lúc mở backlog) bị thu hẹp có chủ
ý: chỉ vế "có một spec hợp đồng in/out tự-mô-tả" là việc của STR46; hai vế
còn lại (chiều-ra khởi-xướng, increment terminal/pane) thuộc PBI khác.
```

### Unified diff

```diff
No text difference.
```

## claim_deb4b4da2abbc3d6190dfce1c75cabf2

Source: docs/io-contract.md#unheaded-block-28

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-44

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_deb4b4da2abbc3d6190dfce1c75cabf2 |
| sourceUnitDigest | fd7e473ad76cf591 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-44 |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | Also out of scope: the daemon, core verb-logic extracted as a lib, and the fgos-discovered block; carried verbatim. |
| targetUnitDigest | fd7e473ad76cf591e6a132079c9b744f |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
Cũng nằm ngoài: daemon (chưa xây), tách core verb-logic thành lib độc lập
CLI (prerequisite của kiến trúc daemon tương lai, refactor thuần không đổi
hành vi), và khối `fgos-discovered` (giao thức worker→runner, không phải
cửa ra tới người).
```

### Target unit

```text
Cũng nằm ngoài: daemon (chưa xây), tách core verb-logic thành lib độc lập
CLI (prerequisite của kiến trúc daemon tương lai, refactor thuần không đổi
hành vi), và khối `fgos-discovered` (giao thức worker→runner, không phải
cửa ra tới người).
```

### Unified diff

```diff
No text difference.
```

## claim_7524deb4b2a1c12d1652076040bfec36

Source: docs/io-contract.md#tham-chiếu

Target: docs/platform/work-state/contracts/cli-io-contract.md#12-references

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_7524deb4b2a1c12d1652076040bfec36 |
| sourceUnitDigest | 701eefe16b5100fc |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | 12-references |
| claimKind | navigation |
| disposition | promote |
| reviewStatus | pending |
| rationale | H2 'Tham chiếu' maps to '12. References'; title language and numbering differ. Reference lists are navigation, not contract. |
| targetUnitDigest | 9b906d61cd8f824de9ce5a5b203808e7 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
## Tham chiếu

`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` (kiến trúc cửa) ·
`docs/decisions/0011-version-tuong-minh-cho-moi-contract.md` (version) ·
`docs/specs/work-state.md` §envelope, §Sổ verb máy-đọc, §Danh tính người
ghi (chi tiết trường/hành vi) · `docs/specs/runner.md` RUL61 (envelope
stdout runner) · `docs/architecture-map.md` CTR001/CTR003/CTR004 (sổ đăng
ký contract) · `docs/history/str46-io-contract/` (CONTEXT.md 37 quyết định
khoá, plan.md bốn lát).
```

### Target unit

```text
## 12. References

`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` (kiến trúc cửa) ·
`docs/decisions/0011-version-tuong-minh-cho-moi-contract.md` (version) ·
`docs/specs/work-state.md` §envelope, §Sổ verb máy-đọc, §Danh tính người
ghi (chi tiết trường/hành vi) · `docs/specs/runner.md` RUL61 (envelope
stdout runner) · `docs/architecture-map.md` CTR001/CTR003/CTR004 (sổ đăng
ký contract) · `docs/history/str46-io-contract/` (CONTEXT.md 37 quyết định
khoá, plan.md bốn lát).
```

### Unified diff

```diff
--- "docs/io-contract.md#tham-chiếu"
+++ "docs/platform/work-state/contracts/cli-io-contract.md#12-references"
@@ -1,4 +1,4 @@
-## Tham chiếu
+## 12. References
 
 `docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` (kiến trúc cửa) ·
 `docs/decisions/0011-version-tuong-minh-cho-moi-contract.md` (version) ·
```

## claim_d802aabd387ae98595c102f0e857f9b1

Source: docs/io-contract.md#unheaded-block-29

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-45

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_d802aabd387ae98595c102f0e857f9b1 |
| sourceUnitDigest | 7fddf59545c800c1 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-45 |
| claimKind | navigation |
| disposition | promote |
| reviewStatus | pending |
| rationale | Reference list of legacy paths (decisions 0014/0011, specs, architecture-map, history) carried verbatim as inline code, not links; the map flags that authoring may later rewrite them, but the candidate text is currently identical to the source. |
| targetUnitDigest | 7fddf59545c800c11029e0609a32bd90 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` (kiến trúc cửa) ·
`docs/decisions/0011-version-tuong-minh-cho-moi-contract.md` (version) ·
`docs/specs/work-state.md` §envelope, §Sổ verb máy-đọc, §Danh tính người
ghi (chi tiết trường/hành vi) · `docs/specs/runner.md` RUL61 (envelope
stdout runner) · `docs/architecture-map.md` CTR001/CTR003/CTR004 (sổ đăng
ký contract) · `docs/history/str46-io-contract/` (CONTEXT.md 37 quyết định
khoá, plan.md bốn lát).
```

### Target unit

```text
`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` (kiến trúc cửa) ·
`docs/decisions/0011-version-tuong-minh-cho-moi-contract.md` (version) ·
`docs/specs/work-state.md` §envelope, §Sổ verb máy-đọc, §Danh tính người
ghi (chi tiết trường/hành vi) · `docs/specs/runner.md` RUL61 (envelope
stdout runner) · `docs/architecture-map.md` CTR001/CTR003/CTR004 (sổ đăng
ký contract) · `docs/history/str46-io-contract/` (CONTEXT.md 37 quyết định
khoá, plan.md bốn lát).
```

### Unified diff

```diff
No text difference.
```

## claim_2b155082055823ccabf6fb40242abe42

Source: docs/io-contract.md#ngoại-lệ-có-lý-do

Target: docs/platform/work-state/contracts/cli-io-contract.md#5-reasoned-envelope-exceptions

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_2b155082055823ccabf6fb40242abe42 |
| sourceUnitDigest | f63dfd5438d66a7145bd622f82c7ed32a5fd0426cfb6fb77d4fc6d5aa5bb9e18 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | 5-reasoned-envelope-exceptions |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | Main commit 3ea75475d911ca02c9d8b5011dca4f748cc5820f changes this IO source unit. All source sentences are carried verbatim within the complete reasoned-exceptions heading section, including the fifth hook exception and fgos-discovered exclusion. Paragraph boundaries in the candidate remain stable to avoid changing unrelated target identities. A manual whole-section carry, not a claimed script-proven exact block. Independent targeted review pending. |
| targetUnitDigest | bc5d36dad759ec51b5aeab14930524be6e9814c9d2a85cb8af2cbecccdd846a2 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
### Ngoại lệ có lý do

Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung
đúng một chữ, "ngoại lệ có lý do", không gọi tuỳ hứng theo từng chỗ:

1. **Sổ verb máy-đọc** (`--help`/`--help --json`, kể cả `<verb> --help`) —
   siêu dữ liệu về CLI, không phải payload của một verb.
2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh
   qua cờ `--pretty`, không phải payload mặc định.
3. **Log worker** (`.fgos/logs/<id>.log`) — text trần CỐ Ý, để `tail -f`
   thấy được ngay; bọc phong bì sẽ phá đúng công dụng đó.
4. **Luồng progress-trace của `fgos-runner`** (gặt-lại, nhận việc, phán
   làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng — cộng dòng lifecycle
   "watch mode stopped" khi nhận tín hiệu dừng) — in console y nguyên như
   trước, một tính năng KHÁC (đã khoá) với hợp đồng này, không đụng.
5. **Cửa hook thực thi agent** (`fgos hook <dispatch-decide|decision-question>`) —
   bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,
   `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,
   hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host.
**Khối `fgos-discovered`** (worker phát cho runner nêu việc mới phát hiện)
NẰM NGOÀI hợp đồng này — nó là giao thức worker→runner của CTR003, không
phải cửa ra tới người.
```

### Target unit

```text
## 5. Reasoned Envelope Exceptions

Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung
đúng một chữ, "ngoại lệ có lý do", không gọi tuỳ hứng theo từng chỗ:

1. **Sổ verb máy-đọc** (`--help`/`--help --json`, kể cả `<verb> --help`) —
   siêu dữ liệu về CLI, không phải payload của một verb.
2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh
   qua cờ `--pretty`, không phải payload mặc định.
3. **Log worker** (`.fgos/logs/<id>.log`) — text trần CỐ Ý, để `tail -f`
   thấy được ngay; bọc phong bì sẽ phá đúng công dụng đó.
4. **Luồng progress-trace của `fgos-runner`** (gặt-lại, nhận việc, phán
   làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng — cộng dòng lifecycle
   "watch mode stopped" khi nhận tín hiệu dừng) — in console y nguyên như
   trước, một tính năng KHÁC (đã khoá) với hợp đồng này, không đụng.
5. **Cửa hook thực thi agent** (`fgos hook <dispatch-decide|decision-question>`) —
   bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,
   `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,
   hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host.

**Khối `fgos-discovered`** (worker phát cho runner nêu việc mới phát hiện)
NẰM NGOÀI hợp đồng này — nó là giao thức worker→runner của CTR003, không
phải cửa ra tới người.
```

### Unified diff

```diff
--- "docs/io-contract.md#ngoại-lệ-có-lý-do"
+++ "docs/platform/work-state/contracts/cli-io-contract.md#5-reasoned-envelope-exceptions"
@@ -1,4 +1,4 @@
-### Ngoại lệ có lý do
+## 5. Reasoned Envelope Exceptions
 
 Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung
 đúng một chữ, "ngoại lệ có lý do", không gọi tuỳ hứng theo từng chỗ:
@@ -17,6 +17,7 @@ Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng —
    bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,
    `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,
    hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host.
+
 **Khối `fgos-discovered`** (worker phát cho runner nêu việc mới phát hiện)
 NẰM NGOÀI hợp đồng này — nó là giao thức worker→runner của CTR003, không
 phải cửa ra tới người.
\ No newline at end of file
```

## claim_992a812b2fcaa4f93dd86d2190d7ac3a

Source: docs/io-contract.md#unheaded-block-14

Target: docs/platform/work-state/contracts/cli-io-contract.md#5-reasoned-envelope-exceptions

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_992a812b2fcaa4f93dd86d2190d7ac3a |
| sourceUnitDigest | cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | 5-reasoned-envelope-exceptions |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | Main commit 3ea75475d911ca02c9d8b5011dca4f748cc5820f changes this IO source unit. All source sentences are carried verbatim within the complete reasoned-exceptions heading section, including the fifth hook exception and fgos-discovered exclusion. Paragraph boundaries in the candidate remain stable to avoid changing unrelated target identities. A manual whole-section carry, not a claimed script-proven exact block. Independent targeted review pending. |
| targetUnitDigest | bc5d36dad759ec51b5aeab14930524be6e9814c9d2a85cb8af2cbecccdd846a2 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung
đúng một chữ, "ngoại lệ có lý do", không gọi tuỳ hứng theo từng chỗ:
```

### Target unit

```text
## 5. Reasoned Envelope Exceptions

Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung
đúng một chữ, "ngoại lệ có lý do", không gọi tuỳ hứng theo từng chỗ:

1. **Sổ verb máy-đọc** (`--help`/`--help --json`, kể cả `<verb> --help`) —
   siêu dữ liệu về CLI, không phải payload của một verb.
2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh
   qua cờ `--pretty`, không phải payload mặc định.
3. **Log worker** (`.fgos/logs/<id>.log`) — text trần CỐ Ý, để `tail -f`
   thấy được ngay; bọc phong bì sẽ phá đúng công dụng đó.
4. **Luồng progress-trace của `fgos-runner`** (gặt-lại, nhận việc, phán
   làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng — cộng dòng lifecycle
   "watch mode stopped" khi nhận tín hiệu dừng) — in console y nguyên như
   trước, một tính năng KHÁC (đã khoá) với hợp đồng này, không đụng.
5. **Cửa hook thực thi agent** (`fgos hook <dispatch-decide|decision-question>`) —
   bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,
   `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,
   hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host.

**Khối `fgos-discovered`** (worker phát cho runner nêu việc mới phát hiện)
NẰM NGOÀI hợp đồng này — nó là giao thức worker→runner của CTR003, không
phải cửa ra tới người.
```

### Unified diff

```diff
--- "docs/io-contract.md#unheaded-block-14"
+++ "docs/platform/work-state/contracts/cli-io-contract.md#5-reasoned-envelope-exceptions"
@@ -1,2 +1,23 @@
+## 5. Reasoned Envelope Exceptions
+
 Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung
-đúng một chữ, "ngoại lệ có lý do", không gọi tuỳ hứng theo từng chỗ:
\ No newline at end of file
+đúng một chữ, "ngoại lệ có lý do", không gọi tuỳ hứng theo từng chỗ:
+
+1. **Sổ verb máy-đọc** (`--help`/`--help --json`, kể cả `<verb> --help`) —
+   siêu dữ liệu về CLI, không phải payload của một verb.
+2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh
+   qua cờ `--pretty`, không phải payload mặc định.
+3. **Log worker** (`.fgos/logs/<id>.log`) — text trần CỐ Ý, để `tail -f`
+   thấy được ngay; bọc phong bì sẽ phá đúng công dụng đó.
+4. **Luồng progress-trace của `fgos-runner`** (gặt-lại, nhận việc, phán
+   làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng — cộng dòng lifecycle
+   "watch mode stopped" khi nhận tín hiệu dừng) — in console y nguyên như
+   trước, một tính năng KHÁC (đã khoá) với hợp đồng này, không đụng.
+5. **Cửa hook thực thi agent** (`fgos hook <dispatch-decide|decision-question>`) —
+   bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,
+   `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,
+   hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host.
+
+**Khối `fgos-discovered`** (worker phát cho runner nêu việc mới phát hiện)
+NẰM NGOÀI hợp đồng này — nó là giao thức worker→runner của CTR003, không
+phải cửa ra tới người.
\ No newline at end of file
```

## claim_dd296404e1163caafba00641cf0adc79

Source: docs/io-contract.md#unheaded-block-15

Target: docs/platform/work-state/contracts/cli-io-contract.md#5-reasoned-envelope-exceptions

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_dd296404e1163caafba00641cf0adc79 |
| sourceUnitDigest | 8b0c15df567594f067a267c8afb4414b290877d5f086aff68d1aab192ad5e908 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | 5-reasoned-envelope-exceptions |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | Main commit 3ea75475d911ca02c9d8b5011dca4f748cc5820f changes this IO source unit. All source sentences are carried verbatim within the complete reasoned-exceptions heading section, including the fifth hook exception and fgos-discovered exclusion. Paragraph boundaries in the candidate remain stable to avoid changing unrelated target identities. A manual whole-section carry, not a claimed script-proven exact block. Independent targeted review pending. |
| targetUnitDigest | bc5d36dad759ec51b5aeab14930524be6e9814c9d2a85cb8af2cbecccdd846a2 |
| authoredBy | codex-session:1@2026-10-08 |

### Source unit

```text
1. **Sổ verb máy-đọc** (`--help`/`--help --json`, kể cả `<verb> --help`) —
   siêu dữ liệu về CLI, không phải payload của một verb.
2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh
   qua cờ `--pretty`, không phải payload mặc định.
3. **Log worker** (`.fgos/logs/<id>.log`) — text trần CỐ Ý, để `tail -f`
   thấy được ngay; bọc phong bì sẽ phá đúng công dụng đó.
4. **Luồng progress-trace của `fgos-runner`** (gặt-lại, nhận việc, phán
   làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng — cộng dòng lifecycle
   "watch mode stopped" khi nhận tín hiệu dừng) — in console y nguyên như
   trước, một tính năng KHÁC (đã khoá) với hợp đồng này, không đụng.
5. **Cửa hook thực thi agent** (`fgos hook <dispatch-decide|decision-question>`) —
   bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,
   `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,
   hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host.
**Khối `fgos-discovered`** (worker phát cho runner nêu việc mới phát hiện)
NẰM NGOÀI hợp đồng này — nó là giao thức worker→runner của CTR003, không
phải cửa ra tới người.
```

### Target unit

```text
## 5. Reasoned Envelope Exceptions

Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung
đúng một chữ, "ngoại lệ có lý do", không gọi tuỳ hứng theo từng chỗ:

1. **Sổ verb máy-đọc** (`--help`/`--help --json`, kể cả `<verb> --help`) —
   siêu dữ liệu về CLI, không phải payload của một verb.
2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh
   qua cờ `--pretty`, không phải payload mặc định.
3. **Log worker** (`.fgos/logs/<id>.log`) — text trần CỐ Ý, để `tail -f`
   thấy được ngay; bọc phong bì sẽ phá đúng công dụng đó.
4. **Luồng progress-trace của `fgos-runner`** (gặt-lại, nhận việc, phán
   làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng — cộng dòng lifecycle
   "watch mode stopped" khi nhận tín hiệu dừng) — in console y nguyên như
   trước, một tính năng KHÁC (đã khoá) với hợp đồng này, không đụng.
5. **Cửa hook thực thi agent** (`fgos hook <dispatch-decide|decision-question>`) —
   bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,
   `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,
   hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host.

**Khối `fgos-discovered`** (worker phát cho runner nêu việc mới phát hiện)
NẰM NGOÀI hợp đồng này — nó là giao thức worker→runner của CTR003, không
phải cửa ra tới người.
```

### Unified diff

```diff
--- "docs/io-contract.md#unheaded-block-15"
+++ "docs/platform/work-state/contracts/cli-io-contract.md#5-reasoned-envelope-exceptions"
@@ -1,3 +1,8 @@
+## 5. Reasoned Envelope Exceptions
+
+Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung
+đúng một chữ, "ngoại lệ có lý do", không gọi tuỳ hứng theo từng chỗ:
+
 1. **Sổ verb máy-đọc** (`--help`/`--help --json`, kể cả `<verb> --help`) —
    siêu dữ liệu về CLI, không phải payload của một verb.
 2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh
@@ -12,6 +17,7 @@
    bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,
    `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,
    hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host.
+
 **Khối `fgos-discovered`** (worker phát cho runner nêu việc mới phát hiện)
 NẰM NGOÀI hợp đồng này — nó là giao thức worker→runner của CTR003, không
 phải cửa ra tới người.
\ No newline at end of file
```

## Unmatched candidate units

### docs/platform/work-state/contracts/cli-io-contract.md#cli-io-contract

````text
# CLI I/O Contract

```txt
Document type: Contract
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens.
Design status: Candidate
Last reviewed: 2026-10-06
Added in candidate: the headings Single Write Door, Writer Source Trust Levels, Writer Resolution Rules, Caller Role, Error Path Is Not Enveloped, Runner Stdout Envelope, Recognizing A Real Envelope and Entry Fields And Effect Axes subdivide sections of the sources that have no heading of their own; the text under them is carried from the sources.
Related:
- docs/platform/work-state/README.md
- docs/platform/work-state/spec.md
- docs/platform/work-state/decisions/retired-decision-history.md
- docs/specs/work-state.md
- docs/io-contract.md
```
````

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-1

````text
```txt
Document type: Contract
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens.
Design status: Candidate
Last reviewed: 2026-10-06
Added in candidate: the headings Single Write Door, Writer Source Trust Levels, Writer Resolution Rules, Caller Role, Error Path Is Not Enveloped, Runner Stdout Envelope, Recognizing A Real Envelope and Entry Fields And Effect Axes subdivide sections of the sources that have no heading of their own; the text under them is carried from the sources.
Related:
- docs/platform/work-state/README.md
- docs/platform/work-state/spec.md
- docs/platform/work-state/decisions/retired-decision-history.md
- docs/specs/work-state.md
- docs/io-contract.md
```
````

### docs/platform/work-state/contracts/cli-io-contract.md#single-write-door

```text
### Single Write Door

Mọi thao tác ghi đi qua đúng **một cửa**: gọi verb của `bin/fgos.mjs`
(CTR001/CTR002). Không có đường ghi thứ hai vào `.fgos/`.
```

### docs/platform/work-state/contracts/cli-io-contract.md#writer-identity

```text
### Writer Identity

Mỗi sự kiện ghi qua ba cửa ghi chính (`work.move`, `work.edit`, `work.step`)
mang thêm một trường **writer** — object lồng đúng hai trường con, `id` và
`source`. Đây là một khái niệm MỚI, tách bạch có chủ ý khỏi `role`
(Data Dictionary #14, xem "Bản ghi settlement" trên): `role` trả lời "người
gọi thuộc LOẠI nào" (`human`/`runner`/`session`/`system`), còn `writer`
trả lời "người gọi là CÁ THỂ nào" — phân biệt được hai phiên agent cùng chạy
song song, cùng mang `role: session` nhưng là hai tiến trình khác nhau
(per str46-io-contract). The gates[id] projection derived from `work.move` events carries CTR004/v1 version token through the `SCHEMA_VERSION` field of the source event, per str46-io-contract.

`writer.id` là chuỗi hoặc số định danh tiến trình ghi. `writer.source` nói
độ tin của giá trị đó — KHÔNG phải một trường độc lập, mà đi kèm bắt buộc với
`id`:

Mỗi lần ghi mang thêm một trường danh tính người/tiến-trình gọi, `writer`:

**Đây là quy thuộc, không phải xác thực** (D1): CLI local không xác thực
được ai đang gọi nó — ai chạy được `fgos` thì đã ghi thẳng vào `.fgos/`
được. Cổng này mua về dấu vết audit + chống nhầm giữa các phiên, không mua
về an ninh. Do đó **caller chưa xác danh KHÔNG bị chặn** gọi verb ghi — D9
chọn ghi-không-chặn để không gãy luồng người gõ tay/CI đang chạy; chặn thật
thuộc tầng phân quyền (STR38) và cửa mạng của daemon tương lai (STR48), cả
hai nằm NGOÀI hợp đồng này.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-5

```text
Mỗi sự kiện ghi qua ba cửa ghi chính (`work.move`, `work.edit`, `work.step`)
mang thêm một trường **writer** — object lồng đúng hai trường con, `id` và
`source`. Đây là một khái niệm MỚI, tách bạch có chủ ý khỏi `role`
(Data Dictionary #14, xem "Bản ghi settlement" trên): `role` trả lời "người
gọi thuộc LOẠI nào" (`human`/`runner`/`session`/`system`), còn `writer`
trả lời "người gọi là CÁ THỂ nào" — phân biệt được hai phiên agent cùng chạy
song song, cùng mang `role: session` nhưng là hai tiến trình khác nhau
(per str46-io-contract). The gates[id] projection derived from `work.move` events carries CTR004/v1 version token through the `SCHEMA_VERSION` field of the source event, per str46-io-contract.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-6

```text
`writer.id` là chuỗi hoặc số định danh tiến trình ghi. `writer.source` nói
độ tin của giá trị đó — KHÔNG phải một trường độc lập, mà đi kèm bắt buộc với
`id`:
```

### docs/platform/work-state/contracts/cli-io-contract.md#writer-source-trust-levels

```text
### Writer Source Trust Levels

| source | Ý nghĩa | Độ tin |
|---|---|---|
| `registry` | `id` khớp một phiên đang sống trong sổ đăng ký phiên của fgOS (`.fgos/sessions.json`) | Cao nhất — do chính fgOS cấp và xác nhận |
| `env` | `id` lấy từ biến môi trường phiên agent (`FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID`), nhưng KHÔNG khớp phiên nào đang sống trong sổ đăng ký | Trung bình — ai cũng tự set được biến môi trường |
| `pid` | Không có biến môi trường phiên nào hợp lệ; suy đoán tốt-nhất từ pid một tổ tiên tiến trình gần (terminal tay gõ) | Thấp — best-effort, có thể trùng giữa hai pane cùng shell |
| `unresolved` | KHÔNG một nguồn nào xác nhận được; `id` vẫn là pid của chính tiến trình ghi (KHÔNG BAO GIỜ rỗng/vắng mặt) — `unresolved` là một NHÃN XUẤT XỨ, không phải danh tính vắng mặt (per str46-io-contract) | Không xác định |

- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song
  song), luôn có mặt.
- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu
  tiên: `registry` (đối chiếu được với `.fgos/sessions.json`, tin nhất) ·
  `env` (biến môi trường, ai cũng set được) · `pid` (dò ngược tiến trình cha,
  best-effort) · `unresolved` (không nguồn nào xác nhận được — `id` vẫn là
  pid của chính tiến trình gọi, KHÔNG rỗng, KHÔNG vắng khoá; chỉ nhãn
  `source` nói giá trị chưa kiểm chứng được).
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-9

```text
| source | Ý nghĩa | Độ tin |
|---|---|---|
| `registry` | `id` khớp một phiên đang sống trong sổ đăng ký phiên của fgOS (`.fgos/sessions.json`) | Cao nhất — do chính fgOS cấp và xác nhận |
| `env` | `id` lấy từ biến môi trường phiên agent (`FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID`), nhưng KHÔNG khớp phiên nào đang sống trong sổ đăng ký | Trung bình — ai cũng tự set được biến môi trường |
| `pid` | Không có biến môi trường phiên nào hợp lệ; suy đoán tốt-nhất từ pid một tổ tiên tiến trình gần (terminal tay gõ) | Thấp — best-effort, có thể trùng giữa hai pane cùng shell |
| `unresolved` | KHÔNG một nguồn nào xác nhận được; `id` vẫn là pid của chính tiến trình ghi (KHÔNG BAO GIỜ rỗng/vắng mặt) — `unresolved` là một NHÃN XUẤT XỨ, không phải danh tính vắng mặt (per str46-io-contract) | Không xác định |
```

### docs/platform/work-state/contracts/cli-io-contract.md#writer-resolution-rules

```text
### Writer Resolution Rules

**Registry chỉ ĐỐI CHIẾU, không bao giờ tự cấp danh tính** (per str46-io-contract): giá trị `id` lấy từ biến môi trường luôn giữ nguyên bất
kể sổ đăng ký có khớp hay không — sổ đăng ký chỉ nâng độ tin (`source`) khi
khớp, không bao giờ đổi hay tạo ra `id`. Một dòng sổ đăng ký KHÔNG BAO GIỜ
khớp theo thư mục làm việc hay theo pid của chính dòng đó — chỉ khớp đúng
`id` với `sessionId` của dòng — vì khớp theo thư mục sẽ gộp hai phiên khác
nhau trong cùng một worktree thành một danh tính, phá đúng mục đích khoá
hoạt động cây chính (xem spec Runner "Khoá hoạt động cây chính").

Một giá trị `id` sai định dạng (ký tự lạ, quá dài) bị LOẠI ở tầng phân giải
và rơi xuống nguồn kế tiếp — KHÔNG BAO GIỜ ném lỗi, KHÔNG BAO GIỜ chặn verb
(per str46-io-contract); không có validator nào đứng trên đường ghi
`writer`. `writer` fold lên item KHÔNG ĐIỀU KIỆN, GHI ĐÈ mỗi lần (latest-wins)
— khác khuôn "cộng thêm không đè" của outcome/friction/settlement, vì đây là
danh tính của LẦN GHI GẦN NHẤT, không phải một chuỗi lịch sử cần giữ mọi lần.
Item chưa từng qua tính năng này không mang `writer` — vắng mặt hoàn toàn,
tương thích ngược (RUL11 (tiến hóa schema)). Cơ chế phân giải đầy đủ (thứ tự nguồn, khoá hoạt động cây chính dùng cùng danh tính này): spec Runner RUL49 (compound-learning đổi trục: từ stage sang status retrospective).
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-11

```text
**Registry chỉ ĐỐI CHIẾU, không bao giờ tự cấp danh tính** (per str46-io-contract): giá trị `id` lấy từ biến môi trường luôn giữ nguyên bất
kể sổ đăng ký có khớp hay không — sổ đăng ký chỉ nâng độ tin (`source`) khi
khớp, không bao giờ đổi hay tạo ra `id`. Một dòng sổ đăng ký KHÔNG BAO GIỜ
khớp theo thư mục làm việc hay theo pid của chính dòng đó — chỉ khớp đúng
`id` với `sessionId` của dòng — vì khớp theo thư mục sẽ gộp hai phiên khác
nhau trong cùng một worktree thành một danh tính, phá đúng mục đích khoá
hoạt động cây chính (xem spec Runner "Khoá hoạt động cây chính").
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-12

```text
Một giá trị `id` sai định dạng (ký tự lạ, quá dài) bị LOẠI ở tầng phân giải
và rơi xuống nguồn kế tiếp — KHÔNG BAO GIỜ ném lỗi, KHÔNG BAO GIỜ chặn verb
(per str46-io-contract); không có validator nào đứng trên đường ghi
`writer`. `writer` fold lên item KHÔNG ĐIỀU KIỆN, GHI ĐÈ mỗi lần (latest-wins)
— khác khuôn "cộng thêm không đè" của outcome/friction/settlement, vì đây là
danh tính của LẦN GHI GẦN NHẤT, không phải một chuỗi lịch sử cần giữ mọi lần.
Item chưa từng qua tính năng này không mang `writer` — vắng mặt hoàn toàn,
tương thích ngược (RUL11 (tiến hóa schema)). Cơ chế phân giải đầy đủ (thứ tự nguồn, khoá hoạt động cây chính dùng cùng danh tính này): spec Runner RUL49 (compound-learning đổi trục: từ stage sang status retrospective).
```

### docs/platform/work-state/contracts/cli-io-contract.md#caller-role

```text
### Caller Role

Song song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`
— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ
tư, gán tự động cho cạnh park nội bộ do máy sinh ra như hệ quả một verb,
không do ai quyết định). `role` và `writer` tách bạch: một cái nói "ai gây
ra", một cái nói "loại gì gây ra".
```

### docs/platform/work-state/contracts/cli-io-contract.md#envelope-shape

````text
### Envelope Shape

**Mọi verb** đều in kết quả thành công bọc trong một phong bì chuẩn duy nhất
thay vì in thẳng dữ liệu hay câu chữ cho người. Phong bì có bốn trường:
`contract` (tên+phiên bản chuẩn phong bì), `generated_at` (thời điểm in),
`data_hash` (dấu vân tay của dữ liệu — bên đọc biết dữ liệu đổi chưa mà không
cần so từng trường), và `data` (dữ liệu thật của verb đó). Dữ liệu trong `data`
là **có cấu trúc** (các trường tên rõ nghĩa), không phải câu xác nhận cho người:
verb đọc (`list`/`ready`/`check`/…) trả thẳng đối tượng kết quả; verb ghi trả
đúng những trường nó vừa đổi (ví dụ chuyển trạng thái trả `{id, from, to, seq}`)
— nhờ vậy một surface bất kỳ đọc kết quả bằng MỘT bộ đọc chung, không phải dò
regex trên chữ. Phong bì được đóng tại **một cửa in duy nhất**, nên không verb
nào lọt lưới và không có hai cách in khác nhau.

Mọi verb thành công (ở CẢ HAI binary — `fgos.mjs` và, từ lát 2,
`fgos-runner.mjs`'s dòng kết-cục cuối) in một phong bì chuẩn `fgos.v1` ra
`stdout`:

```
{ contract: 'fgos.v1', generated_at, data_hash, data }
```

`data` có cấu trúc (trường tên rõ nghĩa), không phải câu xác nhận cho
người — verb đọc trả thẳng đối tượng kết quả, verb ghi trả đúng những
trường vừa đổi. Đường lỗi KHÔNG bọc phong bì: chẩn đoán đi `stderr`, thành/
bại phân biệt bằng **exit code**, không bao giờ bằng nội dung chuỗi.
````

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-14

```text
**Mọi verb** đều in kết quả thành công bọc trong một phong bì chuẩn duy nhất
thay vì in thẳng dữ liệu hay câu chữ cho người. Phong bì có bốn trường:
`contract` (tên+phiên bản chuẩn phong bì), `generated_at` (thời điểm in),
`data_hash` (dấu vân tay của dữ liệu — bên đọc biết dữ liệu đổi chưa mà không
cần so từng trường), và `data` (dữ liệu thật của verb đó). Dữ liệu trong `data`
là **có cấu trúc** (các trường tên rõ nghĩa), không phải câu xác nhận cho người:
verb đọc (`list`/`ready`/`check`/…) trả thẳng đối tượng kết quả; verb ghi trả
đúng những trường nó vừa đổi (ví dụ chuyển trạng thái trả `{id, from, to, seq}`)
— nhờ vậy một surface bất kỳ đọc kết quả bằng MỘT bộ đọc chung, không phải dò
regex trên chữ. Phong bì được đóng tại **một cửa in duy nhất**, nên không verb
nào lọt lưới và không có hai cách in khác nhau.
```

### docs/platform/work-state/contracts/cli-io-contract.md#error-path-is-not-enveloped

```text
### Error Path Is Not Enveloped

**Đường lỗi không bọc phong bì.** Chỉ đường thành công in phong bì ra `stdout`;
khi verb ném lỗi, chẩn đoán đi ra `stderr` kèm mã thoát theo bảng phân loại lỗi
(stdout=dữ liệu, stderr=chẩn đoán) — bên gọi phân biệt thành/bại bằng mã thoát,
không phải bằng việc dò nội dung phong bì.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-18

```text
**Đường lỗi không bọc phong bì.** Chỉ đường thành công in phong bì ra `stdout`;
khi verb ném lỗi, chẩn đoán đi ra `stderr` kèm mã thoát theo bảng phân loại lỗi
(stdout=dữ liệu, stderr=chẩn đoán) — bên gọi phân biệt thành/bại bằng mã thoát,
không phải bằng việc dò nội dung phong bì.
```

### docs/platform/work-state/contracts/cli-io-contract.md#runner-stdout-envelope

```text
### Runner Stdout Envelope

**Vòng tự hành (`fgos-runner`) cũng dùng CÙNG phong bì này cho kết cục cuối của
mỗi lượt/chu kỳ** (per str46-io-contract) — in liền một dòng thay vì nhiều
dòng như trên, vì một tiến trình `--watch` phát nhiều phong bì nối tiếp theo
thời gian; chi tiết đầy đủ + các luồng output khác nằm ngoài phong bì: xem spec
Runner RUL61 (writer — danh tính người ghi, tách bạch khỏi vai, không bao giờ chặn verb).

**`fgos.mjs` in đúng một dòng phong bì mỗi lời gọi** (một-shot, nên in
nhiều dòng cho dễ đọc). **`fgos-runner` in MỘT phong bì mỗi lượt `--once`
hoặc mỗi chu kỳ `--watch`, liền một dòng** — vì `--watch` phát nhiều phong
bì nối tiếp theo thời gian, mỗi cái phải trọn trong đúng một dòng để bên
đọc tách được cái này với cái kia; con trỏ (dưới) áp dụng cùng lý do.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-19

```text
**Vòng tự hành (`fgos-runner`) cũng dùng CÙNG phong bì này cho kết cục cuối của
mỗi lượt/chu kỳ** (per str46-io-contract) — in liền một dòng thay vì nhiều
dòng như trên, vì một tiến trình `--watch` phát nhiều phong bì nối tiếp theo
thời gian; chi tiết đầy đủ + các luồng output khác nằm ngoài phong bì: xem spec
Runner RUL61 (writer — danh tính người ghi, tách bạch khỏi vai, không bao giờ chặn verb).
```

### docs/platform/work-state/contracts/cli-io-contract.md#recognizing-a-real-envelope

```text
### Recognizing A Real Envelope

**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm
`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd "dòng
bắt đầu bằng `{`"), vì luồng progress-trace của `fgos-runner` (xem "Ngoại
lệ có lý do" dưới) có thể tự chứa output của trợ lý bắt đầu bằng `{`.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-23

```text
Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung
đúng một chữ, "ngoại lệ có lý do", không gọi tuỳ hứng theo từng chỗ:
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-24

```text
1. **Sổ verb máy-đọc** (`--help`/`--help --json`, kể cả `<verb> --help`) —
   siêu dữ liệu về CLI, không phải payload của một verb.
2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh
   qua cờ `--pretty`, không phải payload mặc định.
3. **Log worker** (`.fgos/logs/<id>.log`) — text trần CỐ Ý, để `tail -f`
   thấy được ngay; bọc phong bì sẽ phá đúng công dụng đó.
4. **Luồng progress-trace của `fgos-runner`** (gặt-lại, nhận việc, phán
   làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng — cộng dòng lifecycle
   "watch mode stopped" khi nhận tín hiệu dừng) — in console y nguyên như
   trước, một tính năng KHÁC (đã khoá) với hợp đồng này, không đụng.
5. **Cửa hook thực thi agent** (`fgos hook <dispatch-decide|decision-question>`) —
   bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,
   `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,
   hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-25

```text
**Khối `fgos-discovered`** (worker phát cho runner nêu việc mới phát hiện)
NẰM NGOÀI hợp đồng này — nó là giao thức worker→runner của CTR003, không
phải cửa ra tới người.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-26

```text
**Phân trang cho verb trả tập lớn (per str46-io-contract, được tsk-483 mở lại — xem `docs/history/tsk-483-list-side-log-pagination-
scoping/CONTEXT.md`).** Sổ verb khai thêm cờ `paginated` (đúng/sai) cho
MỌI verb — chỉ bốn verb mang `paginated: true`: `ready`, `triage`,
`evolve` (lượt liệt-kê không cờ của nó), và khoá `work` của `list`. Bốn
verb này nhận thêm hai tham số tuỳ chọn `--cursor`/`--limit`: không
truyền cờ nào → kết quả y hệt hôm nay (mảng/map đầy đủ, không đổi hình
dạng) — NGOẠI LỆ DUY NHẤT: `list --all --json` không kèm `--cursor`/
`--limit` giữ nguyên hình dạng thô này VĨNH VIỄN, vì `packages/herdr-fgos-common/rust/src/
fgos.rs` (crate Rust ngoài repo Node này) đọc đúng lời gọi đó làm hợp
đồng công khai. Mọi tổ hợp KHÁC của `list` (mặc định trần không cờ nào,
`--id`, hoặc bất kỳ tổ hợp nào có `--cursor`/`--limit` — kể cả kèm
`--all`) đều thu hẹp `decisions`/`discovery`/`gates`/`settlements`/
`outcomes`/`frictions`/`learnings`/`decisionsById` xuống đúng tập id đang
thật sự được trả trong `work` — `tools` (khoá theo TÊN công cụ, không
theo id việc) không bao giờ bị đụng tới. Với ba verb còn lại (`ready`/
`triage`/`evolve`), truyền một trong hai `--cursor`/`--limit` → kết quả
đổi hình dạng thành `{items, nextCursor}`. Con trỏ (`cursor`) là **đục
hoàn toàn** —
người gọi chỉ nhận lại nguyên văn từ `nextCursor` của lượt trước rồi truyền
tiếp, không bao giờ tự phân tích hay tự chế. `nextCursor` là `null` khi đã
tới cuối tập. Một con trỏ trỏ tới một mục đã rời tập (vd việc đã `done` từ
lượt trước) là lỗi phạm trù `validation` — thông điệp lỗi tự nêu cách sửa
(bắt đầu lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang
(`paginated: false`, lý do ghi ngay trong mô tả verb) — mỗi dòng của nó là
một cặp `(a,b)`, không có khoá riêng cho một dòng để làm mốc con trỏ.
```

### docs/platform/work-state/contracts/cli-io-contract.md#manifest-shape

```text
### Manifest Shape

CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng
máy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành
`'2.0'`, per str46-io-contract — tăng từ `'1.0'` vì một trường bị xoá,
xem ngay dưới), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,
lược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một
listener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì
hard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc
trong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ
giúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với
một tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của
`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb
đánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in
dòng "positional: `<tên>`" cho tham số này, KHÔNG BAO GIỜ in nhầm thành
"required: `--<tên>`" như một cờ thật — một tham số vừa nhận positional vừa
nhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc)).

`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố
toàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest
thay vì hard-code từng verb. `schema_version` hiện `'2.0'` (tăng từ `'1.0'`
vì trường `access` bị xoá). Mỗi mục verb mang:
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-29

```text
CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng
máy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành
`'2.0'`, per str46-io-contract — tăng từ `'1.0'` vì một trường bị xoá,
xem ngay dưới), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,
lược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một
listener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì
hard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc
trong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ
giúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với
một tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của
`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb
đánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in
dòng "positional: `<tên>`" cho tham số này, KHÔNG BAO GIỜ in nhầm thành
"required: `--<tên>`" như một cờ thật — một tham số vừa nhận positional vừa
nhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc)).
```

### docs/platform/work-state/contracts/cli-io-contract.md#entry-fields-and-effect-axes

```text
### Entry Fields And Effect Axes

**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`
đơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —
lộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một
PR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái
fgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`
(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb
có bao giờ gọi một dịch vụ ngoài fgOS hay không — xem `fgos --help --json` cho danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`, `coordination` — dispatch executor thật tính là effect ngoài `.fgos/`);
`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể
cả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều
phối hay xác danh; cổng "ai được nói verb nào" vẫn là việc riêng sau này
(backlog STR38).

- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`
  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata
  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).
- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và
  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục
  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,
  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù
  bản thân `review` không hề ghi trạng thái). Xem `fgos --help --json` cho
  danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`,
  `coordination` — dispatch executor thật tính là effect ngoài `.fgos/`).
- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.

Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa
nối vào điều phối hay xác danh; cổng "ai được nói verb nào" thuộc STR38.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-31

```text
**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`
đơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —
lộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một
PR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái
fgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`
(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb
có bao giờ gọi một dịch vụ ngoài fgOS hay không — xem `fgos --help --json` cho danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`, `coordination` — dispatch executor thật tính là effect ngoài `.fgos/`);
`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể
cả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều
phối hay xác danh; cổng "ai được nói verb nào" vẫn là việc riêng sau này
(backlog STR38).
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-34

```text
**Quy ước cờ nhiều-giá-trị (per str46-io-contract).** Sổ verb khai thêm
trường `multiValueFormat` (`'csv'` hay `'json-array'`) trên đúng những tham
số nào mang nhiều giá trị — trước đây khác biệt này chỉ nằm trong văn xuôi
mô tả, không đọc được bằng máy. `deps`, `refs`, `footprint`, `targets` mang
`multiValueFormat: 'csv'` (phân tách bằng dấu phẩy). `acceptance` mang
`multiValueFormat: 'json-array'` (chuỗi JSON-hoá, CỐ Ý không phẩy vì văn
bản một clause có thể tự chứa dấu phẩy). Tham số không mang nhiều giá trị
không có trường này.
```

### docs/platform/work-state/contracts/cli-io-contract.md#9-per-verb-help

```text
## 9. Per-Verb Help

Gọi `--help` (không kèm `--json`) SAU tên một verb cụ thể (vd `fgos submit
--help`) in đúng mục trợ giúp của RIÊNG verb đó (cách gọi, mô tả, tham số,
ví dụ) — không phải toàn bộ sổ verb. Áp dụng ĐỒNG NHẤT cho mọi verb, kể cả
`init`.

- **Runs when:** người/agent gọi `fgos <verb> --help` cho bất kỳ verb nào
  trong sổ verb.
- **Blocked when:** không có điều kiện chặn — mọi verb đều có mục trợ giúp
  riêng.
- **What changes:** không gì — đây là thao tác chỉ-đọc, không ghi sự kiện,
  không đổi bản chiếu, không có tác dụng phụ nào (kể cả với `init` — gọi `fgos
  init --help` KHÔNG chạy `init` thật, không tạo `.fgos/`).
- **Side effects:** không có, cho MỌI verb kể cả những verb thường có tác
  dụng phụ khi gọi thật (vd `init`).
- **Afterwards:** người gọi thấy đúng mục trợ giúp của verb đã nêu tên, thoát
  mã 0 — không bao giờ thoát ở phạm trù lỗi (mã 4) vì thiếu tham số bắt buộc,
  dù tham số đó có mặt hay không (per str77-79-doc-gap-fixes / ea8b9a8d — RUL55 (trợ giúp theo từng verb luôn có thật, không tác dụng phụ)).
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-36

```text
Gọi `--help` (không kèm `--json`) SAU tên một verb cụ thể (vd `fgos submit
--help`) in đúng mục trợ giúp của RIÊNG verb đó (cách gọi, mô tả, tham số,
ví dụ) — không phải toàn bộ sổ verb. Áp dụng ĐỒNG NHẤT cho mọi verb, kể cả
`init`.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-37

```text
- **Runs when:** người/agent gọi `fgos <verb> --help` cho bất kỳ verb nào
  trong sổ verb.
- **Blocked when:** không có điều kiện chặn — mọi verb đều có mục trợ giúp
  riêng.
- **What changes:** không gì — đây là thao tác chỉ-đọc, không ghi sự kiện,
  không đổi bản chiếu, không có tác dụng phụ nào (kể cả với `init` — gọi `fgos
  init --help` KHÔNG chạy `init` thật, không tạo `.fgos/`).
- **Side effects:** không có, cho MỌI verb kể cả những verb thường có tác
  dụng phụ khi gọi thật (vd `init`).
- **Afterwards:** người gọi thấy đúng mục trợ giúp của verb đã nêu tên, thoát
  mã 0 — không bao giờ thoát ở phạm trù lỗi (mã 4) vì thiếu tham số bắt buộc,
  dù tham số đó có mặt hay không (per str77-79-doc-gap-fixes / ea8b9a8d — RUL55 (trợ giúp theo từng verb luôn có thật, không tác dụng phụ)).
```

### docs/platform/work-state/contracts/cli-io-contract.md#13-related-files

```text
## 13. Related Files

- [Work State portal](../README.md)
- [Work State spec](../spec.md)
- [Retired decision history](../decisions/retired-decision-history.md)
- [Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)
- [Legacy source: docs/io-contract.md](../../../io-contract.md)
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-46

```text
- [Work State portal](../README.md)
- [Work State spec](../spec.md)
- [Retired decision history](../decisions/retired-decision-history.md)
- [Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)
- [Legacy source: docs/io-contract.md](../../../io-contract.md)
```
