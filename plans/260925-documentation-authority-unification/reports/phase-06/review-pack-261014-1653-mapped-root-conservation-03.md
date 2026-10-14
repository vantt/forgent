# Mapped root conservation: bounded full-text pack 03

Author session: codex-session:20@2026-10-14
Content commit: 23062c2ce9caaf6711a906673e2dc14c3f345ec3

## source-decision claim_f97af9d102a31ea32cd616380ccb8b0d

Decision:

````json
{
  "claimId": "claim_f97af9d102a31ea32cd616380ccb8b0d",
  "sourceUnitDigest": "471561edd7b46502006089e7284cd2e6316eac6e8ad3ac580e7aac41e148133b",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "471561edd7b46502006089e7284cd2e6316eac6e8ad3ac580e7aac41e148133b",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã",
    "1 · Bảng inventory (13 hệ — 6 của fgOS, 7 của bee)",
    "bee (xưởng — giàn giáo tạm, giữ nguyên)"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#unheaded-block-7 to docs/platform/documentation/history/id-systems-audit.md#unheaded-block-7. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#unheaded-block-7`
Source unit SHA256: `471561edd7b46502006089e7284cd2e6316eac6e8ad3ac580e7aac41e148133b`
Shown source SHA256: `471561edd7b46502006089e7284cd2e6316eac6e8ad3ac580e7aac41e148133b`

````text
| # | Hệ | Định dạng hiện tại | Trạng thái | Định nghĩa ở |
|---|---|---|---|---|
| 7 | D-hex global (quyết định TOÀN XƯỞNG) | `randomUUID()`, trích 8-hex khi cite | ✅ Giữ nguyên — luật citation chốt tại §5 | `.bee/bin/lib/decisions.mjs:67,94,113` |
| 8 | `D<n>` local (quyết định CỤC BỘ 1 feature) | số nguyên nhỏ | ✅ Giữ nguyên — luật citation chốt tại §5 | `docs/history/<feature>/CONTEXT.md`, mẫu `.claude/skills/bee-exploring/references/context-template.md:4-6` |
| 9 | cell-id `<feature>-N` | quy ước, regex thật lỏng (`ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/`) | ✅ Giữ nguyên — convention-scoped, chưa từng va chạm thật | `.bee/bin/lib/cells.mjs:363` |
| 10 | feature slug (kebab) | free-text; unique tính bằng hiệu ứng phụ của `bee worktree new` (từ chối branch/dir đã tồn tại), không phải bằng format id | ✅ Giữ nguyên — cùng lý do #9 | `.bee/bin/lib/cells.mjs:594` (`FEATURE_SLUG_PATTERN`) |
| 11 | `P1`/`P2`/`P3` severity | enum 3 giá trị | ✅ Giữ nguyên — va chạm với #3 đã tự giải quyết vì #3 đổi thành `STR<n>` | `.claude/skills/bee-hive/templates/lib/command-registry.mjs:841` |
| 12 | Session id (đa phiên) | `randomUUID()` đầy đủ | ⏸ Không cần đổi — sổ sách vận hành thuần, không ai trích trong văn xuôi | `.bee/bin/lib/claims.mjs:78` (`createSession`) |
| 13 | Capture-stub id | `randomUUID()` đầy đủ | ⏸ Không cần đổi — cùng lý do #12 | `.bee/bin/lib/capture.mjs:64` |
````

Target: `docs/platform/documentation/history/id-systems-audit.md#unheaded-block-7`
Target unit SHA256: `471561edd7b46502006089e7284cd2e6316eac6e8ad3ac580e7aac41e148133b`
Shown target SHA256: `471561edd7b46502006089e7284cd2e6316eac6e8ad3ac580e7aac41e148133b`

````text
| # | Hệ | Định dạng hiện tại | Trạng thái | Định nghĩa ở |
|---|---|---|---|---|
| 7 | D-hex global (quyết định TOÀN XƯỞNG) | `randomUUID()`, trích 8-hex khi cite | ✅ Giữ nguyên — luật citation chốt tại §5 | `.bee/bin/lib/decisions.mjs:67,94,113` |
| 8 | `D<n>` local (quyết định CỤC BỘ 1 feature) | số nguyên nhỏ | ✅ Giữ nguyên — luật citation chốt tại §5 | `docs/history/<feature>/CONTEXT.md`, mẫu `.claude/skills/bee-exploring/references/context-template.md:4-6` |
| 9 | cell-id `<feature>-N` | quy ước, regex thật lỏng (`ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/`) | ✅ Giữ nguyên — convention-scoped, chưa từng va chạm thật | `.bee/bin/lib/cells.mjs:363` |
| 10 | feature slug (kebab) | free-text; unique tính bằng hiệu ứng phụ của `bee worktree new` (từ chối branch/dir đã tồn tại), không phải bằng format id | ✅ Giữ nguyên — cùng lý do #9 | `.bee/bin/lib/cells.mjs:594` (`FEATURE_SLUG_PATTERN`) |
| 11 | `P1`/`P2`/`P3` severity | enum 3 giá trị | ✅ Giữ nguyên — va chạm với #3 đã tự giải quyết vì #3 đổi thành `STR<n>` | `.claude/skills/bee-hive/templates/lib/command-registry.mjs:841` |
| 12 | Session id (đa phiên) | `randomUUID()` đầy đủ | ⏸ Không cần đổi — sổ sách vận hành thuần, không ai trích trong văn xuôi | `.bee/bin/lib/claims.mjs:78` (`createSession`) |
| 13 | Capture-stub id | `randomUUID()` đầy đủ | ⏸ Không cần đổi — cùng lý do #12 | `.bee/bin/lib/capture.mjs:64` |
````

````diff

````
## source-decision claim_a59646397da7bacc57e6a456c0a64783

Decision:

````json
{
  "claimId": "claim_a59646397da7bacc57e6a456c0a64783",
  "sourceUnitDigest": "1dc9a951665ce941df8fc06467a68f68b4b5ddd0c8226bc9c138a50ffa650923",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "1b-chú-giải-tiền-tố-prefix-chữ-đầy-đủ",
  "targetUnitDigest": "1dc9a951665ce941df8fc06467a68f68b4b5ddd0c8226bc9c138a50ffa650923",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#1b-chú-giải-tiền-tố-prefix-chữ-đầy-đủ to docs/platform/documentation/history/id-systems-audit.md#1b-chú-giải-tiền-tố-prefix-chữ-đầy-đủ. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#1b-chú-giải-tiền-tố-prefix-chữ-đầy-đủ`
Source unit SHA256: `1dc9a951665ce941df8fc06467a68f68b4b5ddd0c8226bc9c138a50ffa650923`
Shown source SHA256: `d56a948445585c0a4d06e9f0ebdde3297df9da173b361fdeb7263d7ce4b1f595`

````text
## 1b · Chú giải tiền tố (prefix → chữ đầy đủ)

| Tiền tố | Chữ đầy đủ | #Hệ |
|---|---|---|
| `tsk-` | Task | 1 |
| `STR` | Story | 3 |
| `ADR` | Architecture Decision Record | 4 |
| `RUL` | Rule | 5 |
| `CTR` | Contract | 6 |

Tiền tố đã BAKE-IN type vào chính chuỗi id — tự khai type ở mọi nơi id
xuất hiện (chat, git diff, log), không phụ thuộc tầng hiển thị nhớ ghép nhãn
riêng (đúng lỗi mà bare `P<n>`/`R#`/`C#` cũ mắc phải). **Quy ước bổ sung cho
prose:** lần đầu nhắc 1 id trong một đoạn văn, viết kèm chữ đầy đủ — vd
"Story STR47", "Rule RUL42" — các lần nhắc sau trong cùng đoạn dùng tiền tố
đủ (không cần lặp chữ đầy đủ).
````

Target: `docs/platform/documentation/history/id-systems-audit.md#1b-chú-giải-tiền-tố-prefix-chữ-đầy-đủ`
Target unit SHA256: `1dc9a951665ce941df8fc06467a68f68b4b5ddd0c8226bc9c138a50ffa650923`
Shown target SHA256: `d56a948445585c0a4d06e9f0ebdde3297df9da173b361fdeb7263d7ce4b1f595`

````text
## 1b · Chú giải tiền tố (prefix → chữ đầy đủ)

| Tiền tố | Chữ đầy đủ | #Hệ |
|---|---|---|
| `tsk-` | Task | 1 |
| `STR` | Story | 3 |
| `ADR` | Architecture Decision Record | 4 |
| `RUL` | Rule | 5 |
| `CTR` | Contract | 6 |

Tiền tố đã BAKE-IN type vào chính chuỗi id — tự khai type ở mọi nơi id
xuất hiện (chat, git diff, log), không phụ thuộc tầng hiển thị nhớ ghép nhãn
riêng (đúng lỗi mà bare `P<n>`/`R#`/`C#` cũ mắc phải). **Quy ước bổ sung cho
prose:** lần đầu nhắc 1 id trong một đoạn văn, viết kèm chữ đầy đủ — vd
"Story STR47", "Rule RUL42" — các lần nhắc sau trong cùng đoạn dùng tiền tố
đủ (không cần lặp chữ đầy đủ).
````

````diff

````
## source-decision claim_805724bfd8e552f9eeb65c177bc897f4

Decision:

````json
{
  "claimId": "claim_805724bfd8e552f9eeb65c177bc897f4",
  "sourceUnitDigest": "a5623141e91cfce796888fcbf3e931047e6b43ef4781dc34c225cd9c90112eba",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "unheaded-block-8",
  "targetUnitDigest": "a5623141e91cfce796888fcbf3e931047e6b43ef4781dc34c225cd9c90112eba",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã",
    "1b · Chú giải tiền tố (prefix → chữ đầy đủ)"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#unheaded-block-8 to docs/platform/documentation/history/id-systems-audit.md#unheaded-block-8. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#unheaded-block-8`
Source unit SHA256: `a5623141e91cfce796888fcbf3e931047e6b43ef4781dc34c225cd9c90112eba`
Shown source SHA256: `a5623141e91cfce796888fcbf3e931047e6b43ef4781dc34c225cd9c90112eba`

````text
| Tiền tố | Chữ đầy đủ | #Hệ |
|---|---|---|
| `tsk-` | Task | 1 |
| `STR` | Story | 3 |
| `ADR` | Architecture Decision Record | 4 |
| `RUL` | Rule | 5 |
| `CTR` | Contract | 6 |
````

Target: `docs/platform/documentation/history/id-systems-audit.md#unheaded-block-8`
Target unit SHA256: `a5623141e91cfce796888fcbf3e931047e6b43ef4781dc34c225cd9c90112eba`
Shown target SHA256: `a5623141e91cfce796888fcbf3e931047e6b43ef4781dc34c225cd9c90112eba`

````text
| Tiền tố | Chữ đầy đủ | #Hệ |
|---|---|---|
| `tsk-` | Task | 1 |
| `STR` | Story | 3 |
| `ADR` | Architecture Decision Record | 4 |
| `RUL` | Rule | 5 |
| `CTR` | Contract | 6 |
````

````diff

````
## source-decision claim_1d678e157bb78c2ff62818a7cd0b623e

Decision:

````json
{
  "claimId": "claim_1d678e157bb78c2ff62818a7cd0b623e",
  "sourceUnitDigest": "a08f7eeafb7f4e98ceac64c002dacc9d98d286a588b965d6c0a538194ee329ca",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "unheaded-block-9",
  "targetUnitDigest": "a08f7eeafb7f4e98ceac64c002dacc9d98d286a588b965d6c0a538194ee329ca",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã",
    "1b · Chú giải tiền tố (prefix → chữ đầy đủ)"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#unheaded-block-9 to docs/platform/documentation/history/id-systems-audit.md#unheaded-block-9. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#unheaded-block-9`
Source unit SHA256: `a08f7eeafb7f4e98ceac64c002dacc9d98d286a588b965d6c0a538194ee329ca`
Shown source SHA256: `a08f7eeafb7f4e98ceac64c002dacc9d98d286a588b965d6c0a538194ee329ca`

````text
Tiền tố đã BAKE-IN type vào chính chuỗi id — tự khai type ở mọi nơi id
xuất hiện (chat, git diff, log), không phụ thuộc tầng hiển thị nhớ ghép nhãn
riêng (đúng lỗi mà bare `P<n>`/`R#`/`C#` cũ mắc phải). **Quy ước bổ sung cho
prose:** lần đầu nhắc 1 id trong một đoạn văn, viết kèm chữ đầy đủ — vd
"Story STR47", "Rule RUL42" — các lần nhắc sau trong cùng đoạn dùng tiền tố
đủ (không cần lặp chữ đầy đủ).
````

Target: `docs/platform/documentation/history/id-systems-audit.md#unheaded-block-9`
Target unit SHA256: `a08f7eeafb7f4e98ceac64c002dacc9d98d286a588b965d6c0a538194ee329ca`
Shown target SHA256: `a08f7eeafb7f4e98ceac64c002dacc9d98d286a588b965d6c0a538194ee329ca`

````text
Tiền tố đã BAKE-IN type vào chính chuỗi id — tự khai type ở mọi nơi id
xuất hiện (chat, git diff, log), không phụ thuộc tầng hiển thị nhớ ghép nhãn
riêng (đúng lỗi mà bare `P<n>`/`R#`/`C#` cũ mắc phải). **Quy ước bổ sung cho
prose:** lần đầu nhắc 1 id trong một đoạn văn, viết kèm chữ đầy đủ — vd
"Story STR47", "Rule RUL42" — các lần nhắc sau trong cùng đoạn dùng tiền tố
đủ (không cần lặp chữ đầy đủ).
````

````diff

````
## source-decision claim_23ea5352c89949156b0a32f14acc991e

Decision:

````json
{
  "claimId": "claim_23ea5352c89949156b0a32f14acc991e",
  "sourceUnitDigest": "0101ef0c9974779507c59756ae156b2ce4c50c706b86833c7412ad7df7cfe943",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "2-vì-sao-mỗi-lựa-chọn-3-bằng-chứng-quyết-định-không-phải-cảm-tính",
  "targetUnitDigest": "0101ef0c9974779507c59756ae156b2ce4c50c706b86833c7412ad7df7cfe943",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#2-vì-sao-mỗi-lựa-chọn-3-bằng-chứng-quyết-định-không-phải-cảm-tính to docs/platform/documentation/history/id-systems-audit.md#2-vì-sao-mỗi-lựa-chọn-3-bằng-chứng-quyết-định-không-phải-cảm-tính. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#2-vì-sao-mỗi-lựa-chọn-3-bằng-chứng-quyết-định-không-phải-cảm-tính`
Source unit SHA256: `0101ef0c9974779507c59756ae156b2ce4c50c706b86833c7412ad7df7cfe943`
Shown source SHA256: `16c6cddbe0ae4adbb089a6592fd16c4ee5af3f748554301c03f89a47f05803ee`

````text
## 2 · Vì sao mỗi lựa chọn — 3 bằng chứng quyết định (không phải cảm tính)

- **`work.id` bỏ slug (#1):** `title` đã lưu sẵn thành field riêng, hiện lên
  ở mọi listing — id không cần lặp lại nó. Mẫu đã có sẵn trong hệ thống:
  Story/ADR/Rule đều tách "id ngắn" khỏi "mô tả dài" — `work.id` là hệ DUY
  NHẤT chưa theo mẫu đó (trước STR53).
- **Con dùng `tsk-<hash>-<n>`, không cần lo lệch dữ liệu:** field `parent`
  **KHÔNG nằm trong `EDITABLE_FIELDS`** (`src/state/store.mjs:184`: chỉ có
  `title, kind, risk, verify, tier, refs, deps`) — comment tại
  `store.mjs:232` xác nhận *"`parent` is NOT editable"*. Sinh 1 lần, không
  bao giờ đổi → nhét vào id con an toàn tuyệt đối, không có nguy cơ id nói
  một đằng, field nói một nẻo.
- **`tsk-` dùng CHUNG cho mọi `kind`, không tách `bug-<hash>`/`ftr-<hash>`...:**
  ngược lại với `parent`, **`kind` CÓ trong `EDITABLE_FIELDS`**
  (`store.mjs:184`) — sửa được qua `fgos edit`. Nếu tiền tố id mã hoá `kind`
  lúc tạo, sau khi `edit` đổi kind thì id nói dối vĩnh viễn (id bất biến,
  kind thì không). Cộng với decision `ADR0002` (mô hình phẳng — loại việc là 1
  field, không phải 1 shape id riêng) → `tsk-` phải đồng nhất.
````

Target: `docs/platform/documentation/history/id-systems-audit.md#2-vì-sao-mỗi-lựa-chọn-3-bằng-chứng-quyết-định-không-phải-cảm-tính`
Target unit SHA256: `0101ef0c9974779507c59756ae156b2ce4c50c706b86833c7412ad7df7cfe943`
Shown target SHA256: `16c6cddbe0ae4adbb089a6592fd16c4ee5af3f748554301c03f89a47f05803ee`

````text
## 2 · Vì sao mỗi lựa chọn — 3 bằng chứng quyết định (không phải cảm tính)

- **`work.id` bỏ slug (#1):** `title` đã lưu sẵn thành field riêng, hiện lên
  ở mọi listing — id không cần lặp lại nó. Mẫu đã có sẵn trong hệ thống:
  Story/ADR/Rule đều tách "id ngắn" khỏi "mô tả dài" — `work.id` là hệ DUY
  NHẤT chưa theo mẫu đó (trước STR53).
- **Con dùng `tsk-<hash>-<n>`, không cần lo lệch dữ liệu:** field `parent`
  **KHÔNG nằm trong `EDITABLE_FIELDS`** (`src/state/store.mjs:184`: chỉ có
  `title, kind, risk, verify, tier, refs, deps`) — comment tại
  `store.mjs:232` xác nhận *"`parent` is NOT editable"*. Sinh 1 lần, không
  bao giờ đổi → nhét vào id con an toàn tuyệt đối, không có nguy cơ id nói
  một đằng, field nói một nẻo.
- **`tsk-` dùng CHUNG cho mọi `kind`, không tách `bug-<hash>`/`ftr-<hash>`...:**
  ngược lại với `parent`, **`kind` CÓ trong `EDITABLE_FIELDS`**
  (`store.mjs:184`) — sửa được qua `fgos edit`. Nếu tiền tố id mã hoá `kind`
  lúc tạo, sau khi `edit` đổi kind thì id nói dối vĩnh viễn (id bất biến,
  kind thì không). Cộng với decision `ADR0002` (mô hình phẳng — loại việc là 1
  field, không phải 1 shape id riêng) → `tsk-` phải đồng nhất.
````

````diff

````
## source-decision claim_20acd513f5587ec61c00cdcf8a695f1a

Decision:

````json
{
  "claimId": "claim_20acd513f5587ec61c00cdcf8a695f1a",
  "sourceUnitDigest": "d271a946720978b50c6594ff2c1dedb5e30fdc4a5ee77e73f3a768b398302ef5",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "unheaded-block-10",
  "targetUnitDigest": "d271a946720978b50c6594ff2c1dedb5e30fdc4a5ee77e73f3a768b398302ef5",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã",
    "2 · Vì sao mỗi lựa chọn — 3 bằng chứng quyết định (không phải cảm tính)"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#unheaded-block-10 to docs/platform/documentation/history/id-systems-audit.md#unheaded-block-10. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#unheaded-block-10`
Source unit SHA256: `d271a946720978b50c6594ff2c1dedb5e30fdc4a5ee77e73f3a768b398302ef5`
Shown source SHA256: `d271a946720978b50c6594ff2c1dedb5e30fdc4a5ee77e73f3a768b398302ef5`

````text
- **`work.id` bỏ slug (#1):** `title` đã lưu sẵn thành field riêng, hiện lên
  ở mọi listing — id không cần lặp lại nó. Mẫu đã có sẵn trong hệ thống:
  Story/ADR/Rule đều tách "id ngắn" khỏi "mô tả dài" — `work.id` là hệ DUY
  NHẤT chưa theo mẫu đó (trước STR53).
- **Con dùng `tsk-<hash>-<n>`, không cần lo lệch dữ liệu:** field `parent`
  **KHÔNG nằm trong `EDITABLE_FIELDS`** (`src/state/store.mjs:184`: chỉ có
  `title, kind, risk, verify, tier, refs, deps`) — comment tại
  `store.mjs:232` xác nhận *"`parent` is NOT editable"*. Sinh 1 lần, không
  bao giờ đổi → nhét vào id con an toàn tuyệt đối, không có nguy cơ id nói
  một đằng, field nói một nẻo.
- **`tsk-` dùng CHUNG cho mọi `kind`, không tách `bug-<hash>`/`ftr-<hash>`...:**
  ngược lại với `parent`, **`kind` CÓ trong `EDITABLE_FIELDS`**
  (`store.mjs:184`) — sửa được qua `fgos edit`. Nếu tiền tố id mã hoá `kind`
  lúc tạo, sau khi `edit` đổi kind thì id nói dối vĩnh viễn (id bất biến,
  kind thì không). Cộng với decision `ADR0002` (mô hình phẳng — loại việc là 1
  field, không phải 1 shape id riêng) → `tsk-` phải đồng nhất.
````

Target: `docs/platform/documentation/history/id-systems-audit.md#unheaded-block-10`
Target unit SHA256: `d271a946720978b50c6594ff2c1dedb5e30fdc4a5ee77e73f3a768b398302ef5`
Shown target SHA256: `d271a946720978b50c6594ff2c1dedb5e30fdc4a5ee77e73f3a768b398302ef5`

````text
- **`work.id` bỏ slug (#1):** `title` đã lưu sẵn thành field riêng, hiện lên
  ở mọi listing — id không cần lặp lại nó. Mẫu đã có sẵn trong hệ thống:
  Story/ADR/Rule đều tách "id ngắn" khỏi "mô tả dài" — `work.id` là hệ DUY
  NHẤT chưa theo mẫu đó (trước STR53).
- **Con dùng `tsk-<hash>-<n>`, không cần lo lệch dữ liệu:** field `parent`
  **KHÔNG nằm trong `EDITABLE_FIELDS`** (`src/state/store.mjs:184`: chỉ có
  `title, kind, risk, verify, tier, refs, deps`) — comment tại
  `store.mjs:232` xác nhận *"`parent` is NOT editable"*. Sinh 1 lần, không
  bao giờ đổi → nhét vào id con an toàn tuyệt đối, không có nguy cơ id nói
  một đằng, field nói một nẻo.
- **`tsk-` dùng CHUNG cho mọi `kind`, không tách `bug-<hash>`/`ftr-<hash>`...:**
  ngược lại với `parent`, **`kind` CÓ trong `EDITABLE_FIELDS`**
  (`store.mjs:184`) — sửa được qua `fgos edit`. Nếu tiền tố id mã hoá `kind`
  lúc tạo, sau khi `edit` đổi kind thì id nói dối vĩnh viễn (id bất biến,
  kind thì không). Cộng với decision `ADR0002` (mô hình phẳng — loại việc là 1
  field, không phải 1 shape id riêng) → `tsk-` phải đồng nhất.
````

````diff

````
## source-decision claim_fb286f73967fbbefdf6e2d4cf60a94d0

Decision:

````json
{
  "claimId": "claim_fb286f73967fbbefdf6e2d4cf60a94d0",
  "sourceUnitDigest": "f1c8d3fde8d06d74b4a14e540d0be408fc436707291a11f3509dfbc5f63afb6e",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "3-nguyên-tắc-dùng-khi-cân-nhắc-đổi-định-dạng",
  "targetUnitDigest": "f1c8d3fde8d06d74b4a14e540d0be408fc436707291a11f3509dfbc5f63afb6e",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#3-nguyên-tắc-dùng-khi-cân-nhắc-đổi-định-dạng to docs/platform/documentation/history/id-systems-audit.md#3-nguyên-tắc-dùng-khi-cân-nhắc-đổi-định-dạng. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#3-nguyên-tắc-dùng-khi-cân-nhắc-đổi-định-dạng`
Source unit SHA256: `f1c8d3fde8d06d74b4a14e540d0be408fc436707291a11f3509dfbc5f63afb6e`
Shown source SHA256: `1c9ea2d383a87fedc2148b4acfe9b2a750a231e5d037af2d49124b61106e01f4`

````text
## 3 · Nguyên tắc dùng khi cân nhắc đổi định dạng

Không phải hệ nào cũng cần tiền tố chữ riêng. Cần tiền tố tường minh khi id
bị trích dẫn rời khỏi ngữ cảnh gốc (không kèm file/cột) HOẶC hai hệ thật sự
trùng ký tự khi đọc cạnh nhau (đúng trường hợp #3 Story vs #11 severity —
đã xử bằng cách đổi #3 thành `STR<n>`).
````

Target: `docs/platform/documentation/history/id-systems-audit.md#3-nguyên-tắc-dùng-khi-cân-nhắc-đổi-định-dạng`
Target unit SHA256: `f1c8d3fde8d06d74b4a14e540d0be408fc436707291a11f3509dfbc5f63afb6e`
Shown target SHA256: `1c9ea2d383a87fedc2148b4acfe9b2a750a231e5d037af2d49124b61106e01f4`

````text
## 3 · Nguyên tắc dùng khi cân nhắc đổi định dạng

Không phải hệ nào cũng cần tiền tố chữ riêng. Cần tiền tố tường minh khi id
bị trích dẫn rời khỏi ngữ cảnh gốc (không kèm file/cột) HOẶC hai hệ thật sự
trùng ký tự khi đọc cạnh nhau (đúng trường hợp #3 Story vs #11 severity —
đã xử bằng cách đổi #3 thành `STR<n>`).
````

````diff

````
## source-decision claim_caaf56bdd60adf0ad5a7de5a96b2e03a

Decision:

````json
{
  "claimId": "claim_caaf56bdd60adf0ad5a7de5a96b2e03a",
  "sourceUnitDigest": "c0c8f8a6074736ef365c333fb50c5e3279aa11e1ee69dd3a1ee8b83fa0a20033",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "unheaded-block-11",
  "targetUnitDigest": "c0c8f8a6074736ef365c333fb50c5e3279aa11e1ee69dd3a1ee8b83fa0a20033",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã",
    "3 · Nguyên tắc dùng khi cân nhắc đổi định dạng"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#unheaded-block-11 to docs/platform/documentation/history/id-systems-audit.md#unheaded-block-11. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#unheaded-block-11`
Source unit SHA256: `c0c8f8a6074736ef365c333fb50c5e3279aa11e1ee69dd3a1ee8b83fa0a20033`
Shown source SHA256: `c0c8f8a6074736ef365c333fb50c5e3279aa11e1ee69dd3a1ee8b83fa0a20033`

````text
Không phải hệ nào cũng cần tiền tố chữ riêng. Cần tiền tố tường minh khi id
bị trích dẫn rời khỏi ngữ cảnh gốc (không kèm file/cột) HOẶC hai hệ thật sự
trùng ký tự khi đọc cạnh nhau (đúng trường hợp #3 Story vs #11 severity —
đã xử bằng cách đổi #3 thành `STR<n>`).
````

Target: `docs/platform/documentation/history/id-systems-audit.md#unheaded-block-11`
Target unit SHA256: `c0c8f8a6074736ef365c333fb50c5e3279aa11e1ee69dd3a1ee8b83fa0a20033`
Shown target SHA256: `c0c8f8a6074736ef365c333fb50c5e3279aa11e1ee69dd3a1ee8b83fa0a20033`

````text
Không phải hệ nào cũng cần tiền tố chữ riêng. Cần tiền tố tường minh khi id
bị trích dẫn rời khỏi ngữ cảnh gốc (không kèm file/cột) HOẶC hai hệ thật sự
trùng ký tự khi đọc cạnh nhau (đúng trường hợp #3 Story vs #11 severity —
đã xử bằng cách đổi #3 thành `STR<n>`).
````

````diff

````
## source-decision claim_8b30e37f66da1f54b9ccb52543c06b3f

Decision:

````json
{
  "claimId": "claim_8b30e37f66da1f54b9ccb52543c06b3f",
  "sourceUnitDigest": "ce70d64fd0d54c56afb54ef3515012729072d003f3b36873c814c88039be4184",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "4-trạng-thái-quyết-định-theo-từng-hệ-chốt-xem-docsdecisions0017-dong-audit-he-id-ten-goimd",
  "targetUnitDigest": "ce70d64fd0d54c56afb54ef3515012729072d003f3b36873c814c88039be4184",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#4-trạng-thái-quyết-định-theo-từng-hệ-chốt-xem-docsdecisions0017-dong-audit-he-id-ten-goimd to docs/platform/documentation/history/id-systems-audit.md#4-trạng-thái-quyết-định-theo-từng-hệ-chốt-xem-docsdecisions0017-dong-audit-he-id-ten-goimd. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#4-trạng-thái-quyết-định-theo-từng-hệ-chốt-xem-docsdecisions0017-dong-audit-he-id-ten-goimd`
Source unit SHA256: `ce70d64fd0d54c56afb54ef3515012729072d003f3b36873c814c88039be4184`
Shown source SHA256: `c2e5f685eecae988803354e1a60009a2ce968c278152914a14217ea87ea87645`

````text
## 4 · Trạng thái quyết định theo từng hệ (chốt — xem `docs/decisions/0017-dong-audit-he-id-ten-goi.md`)

| # | Hệ | Trạng thái |
|---|---|---|
| 1 | `work.id` → `tsk-<hash>` (+ `-<n>` con) | ✅ Đã migrate — STR53 |
| 2 | `kind` | ✅ Giữ nguyên |
| 3 | Story `P<n>` → `STR<n>` | ✅ Đã migrate — STR57 |
| 4 | ADR → `ADR<n>` khi rút gọn | ✅ Đã migrate — STR55 |
| 5 | `R#` → `RUL<n>` | ✅ Đã migrate — STR56 |
| 6 | `C#` → `CTR<n>` | ✅ Đã migrate — STR54, decision `ADR0015` |
| 7 | D-hex global | ✅ Giữ nguyên — luật citation §5 |
| 8 | `D<n>` local | ✅ Giữ nguyên — luật citation §5 |
| 9 | cell-id | ✅ Giữ nguyên |
| 10 | feature slug | ✅ Giữ nguyên |
| 11 | severity | ✅ Giữ nguyên |

Audit đóng: mọi row đã có trạng thái chốt, không còn row 🟡/⏸ chờ quyết
định. Quyết định + bằng chứng đầy đủ nằm ở `docs/decisions/0017-dong-audit-he-id-ten-goi.md`.
````

Target: `docs/platform/documentation/history/id-systems-audit.md#4-trạng-thái-quyết-định-theo-từng-hệ-chốt-xem-docsdecisions0017-dong-audit-he-id-ten-goimd`
Target unit SHA256: `ce70d64fd0d54c56afb54ef3515012729072d003f3b36873c814c88039be4184`
Shown target SHA256: `c2e5f685eecae988803354e1a60009a2ce968c278152914a14217ea87ea87645`

````text
## 4 · Trạng thái quyết định theo từng hệ (chốt — xem `docs/decisions/0017-dong-audit-he-id-ten-goi.md`)

| # | Hệ | Trạng thái |
|---|---|---|
| 1 | `work.id` → `tsk-<hash>` (+ `-<n>` con) | ✅ Đã migrate — STR53 |
| 2 | `kind` | ✅ Giữ nguyên |
| 3 | Story `P<n>` → `STR<n>` | ✅ Đã migrate — STR57 |
| 4 | ADR → `ADR<n>` khi rút gọn | ✅ Đã migrate — STR55 |
| 5 | `R#` → `RUL<n>` | ✅ Đã migrate — STR56 |
| 6 | `C#` → `CTR<n>` | ✅ Đã migrate — STR54, decision `ADR0015` |
| 7 | D-hex global | ✅ Giữ nguyên — luật citation §5 |
| 8 | `D<n>` local | ✅ Giữ nguyên — luật citation §5 |
| 9 | cell-id | ✅ Giữ nguyên |
| 10 | feature slug | ✅ Giữ nguyên |
| 11 | severity | ✅ Giữ nguyên |

Audit đóng: mọi row đã có trạng thái chốt, không còn row 🟡/⏸ chờ quyết
định. Quyết định + bằng chứng đầy đủ nằm ở `docs/decisions/0017-dong-audit-he-id-ten-goi.md`.
````

````diff

````
## source-decision claim_4716bbd563e26aa2c4098334ca3f1aa3

Decision:

````json
{
  "claimId": "claim_4716bbd563e26aa2c4098334ca3f1aa3",
  "sourceUnitDigest": "7bad8fabbdcd3d3967ac4f33869fd016c888307edd833ab1e87e44a5488848a7",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "unheaded-block-12",
  "targetUnitDigest": "7bad8fabbdcd3d3967ac4f33869fd016c888307edd833ab1e87e44a5488848a7",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã",
    "4 · Trạng thái quyết định theo từng hệ (chốt — xem `docs/decisions/0017-dong-audit-he-id-ten-goi.md`)"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#unheaded-block-12 to docs/platform/documentation/history/id-systems-audit.md#unheaded-block-12. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#unheaded-block-12`
Source unit SHA256: `7bad8fabbdcd3d3967ac4f33869fd016c888307edd833ab1e87e44a5488848a7`
Shown source SHA256: `7bad8fabbdcd3d3967ac4f33869fd016c888307edd833ab1e87e44a5488848a7`

````text
| # | Hệ | Trạng thái |
|---|---|---|
| 1 | `work.id` → `tsk-<hash>` (+ `-<n>` con) | ✅ Đã migrate — STR53 |
| 2 | `kind` | ✅ Giữ nguyên |
| 3 | Story `P<n>` → `STR<n>` | ✅ Đã migrate — STR57 |
| 4 | ADR → `ADR<n>` khi rút gọn | ✅ Đã migrate — STR55 |
| 5 | `R#` → `RUL<n>` | ✅ Đã migrate — STR56 |
| 6 | `C#` → `CTR<n>` | ✅ Đã migrate — STR54, decision `ADR0015` |
| 7 | D-hex global | ✅ Giữ nguyên — luật citation §5 |
| 8 | `D<n>` local | ✅ Giữ nguyên — luật citation §5 |
| 9 | cell-id | ✅ Giữ nguyên |
| 10 | feature slug | ✅ Giữ nguyên |
| 11 | severity | ✅ Giữ nguyên |
````

Target: `docs/platform/documentation/history/id-systems-audit.md#unheaded-block-12`
Target unit SHA256: `7bad8fabbdcd3d3967ac4f33869fd016c888307edd833ab1e87e44a5488848a7`
Shown target SHA256: `7bad8fabbdcd3d3967ac4f33869fd016c888307edd833ab1e87e44a5488848a7`

````text
| # | Hệ | Trạng thái |
|---|---|---|
| 1 | `work.id` → `tsk-<hash>` (+ `-<n>` con) | ✅ Đã migrate — STR53 |
| 2 | `kind` | ✅ Giữ nguyên |
| 3 | Story `P<n>` → `STR<n>` | ✅ Đã migrate — STR57 |
| 4 | ADR → `ADR<n>` khi rút gọn | ✅ Đã migrate — STR55 |
| 5 | `R#` → `RUL<n>` | ✅ Đã migrate — STR56 |
| 6 | `C#` → `CTR<n>` | ✅ Đã migrate — STR54, decision `ADR0015` |
| 7 | D-hex global | ✅ Giữ nguyên — luật citation §5 |
| 8 | `D<n>` local | ✅ Giữ nguyên — luật citation §5 |
| 9 | cell-id | ✅ Giữ nguyên |
| 10 | feature slug | ✅ Giữ nguyên |
| 11 | severity | ✅ Giữ nguyên |
````

````diff

````
## source-decision claim_6504152de7baf074041aa49bc24e24a2

Decision:

````json
{
  "claimId": "claim_6504152de7baf074041aa49bc24e24a2",
  "sourceUnitDigest": "fc8ef072789f63b2019979939dd6775cec84a36e89db37f29b28726565f557ed",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "unheaded-block-13",
  "targetUnitDigest": "fc8ef072789f63b2019979939dd6775cec84a36e89db37f29b28726565f557ed",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã",
    "4 · Trạng thái quyết định theo từng hệ (chốt — xem `docs/decisions/0017-dong-audit-he-id-ten-goi.md`)"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#unheaded-block-13 to docs/platform/documentation/history/id-systems-audit.md#unheaded-block-13. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#unheaded-block-13`
Source unit SHA256: `fc8ef072789f63b2019979939dd6775cec84a36e89db37f29b28726565f557ed`
Shown source SHA256: `fc8ef072789f63b2019979939dd6775cec84a36e89db37f29b28726565f557ed`

````text
Audit đóng: mọi row đã có trạng thái chốt, không còn row 🟡/⏸ chờ quyết
định. Quyết định + bằng chứng đầy đủ nằm ở `docs/decisions/0017-dong-audit-he-id-ten-goi.md`.
````

Target: `docs/platform/documentation/history/id-systems-audit.md#unheaded-block-13`
Target unit SHA256: `fc8ef072789f63b2019979939dd6775cec84a36e89db37f29b28726565f557ed`
Shown target SHA256: `fc8ef072789f63b2019979939dd6775cec84a36e89db37f29b28726565f557ed`

````text
Audit đóng: mọi row đã có trạng thái chốt, không còn row 🟡/⏸ chờ quyết
định. Quyết định + bằng chứng đầy đủ nằm ở `docs/decisions/0017-dong-audit-he-id-ten-goi.md`.
````

````diff

````
## source-decision claim_d110505d877522e33bfd11a81effc141

Decision:

````json
{
  "claimId": "claim_d110505d877522e33bfd11a81effc141",
  "sourceUnitDigest": "3b7c5596e7cb831ddd5f4cbba55ae2ed2ec0de0a1a73fbd35aeb9a9583d7c703",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "5-7-d-hex-và-8-d-local-của-lĩnh-vực-gì-ai-dùng-và-luật-citation-chốt",
  "targetUnitDigest": "3b7c5596e7cb831ddd5f4cbba55ae2ed2ec0de0a1a73fbd35aeb9a9583d7c703",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#5-7-d-hex-và-8-d-local-của-lĩnh-vực-gì-ai-dùng-và-luật-citation-chốt to docs/platform/documentation/history/id-systems-audit.md#5-7-d-hex-và-8-d-local-của-lĩnh-vực-gì-ai-dùng-và-luật-citation-chốt. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#5-7-d-hex-và-8-d-local-của-lĩnh-vực-gì-ai-dùng-và-luật-citation-chốt`
Source unit SHA256: `3b7c5596e7cb831ddd5f4cbba55ae2ed2ec0de0a1a73fbd35aeb9a9583d7c703`
Shown source SHA256: `0fcea1ce9e16ff1ad9569ce7adbc63512befc1a8e29193c4c75a6905895b225d`

````text
## 5 · #7 D-hex và #8 D-local — của lĩnh vực gì, ai dùng, và luật citation chốt

Cả hai đều là id của **1 câu quyết định** (không phải id của feature, PBI,
hay cell) — nhưng khác nhau ở **AI ghi / AI đọc / phạm vi bao xa**:

| | #8 D-local (`D<n>`) | #7 D-hex global |
|---|---|---|
| **Ghi khi nào** | Lúc bàn/khám phá **1 feature cụ thể** (bee-exploring), điền vào bảng "Locked Decisions" của CHÍNH file `CONTEXT.md` feature đó | Bất cứ lúc nào, bất cứ feature nào, bất cứ phase nào (explore/plan/execute/review) — qua lệnh `bee decisions log` |
| **Đọc bởi ai** | Chỉ người/agent làm TIẾP feature đó (cùng phiên hoặc phiên resume sau) — mở lại đúng file CONTEXT.md đó | Bất kỳ agent nào, feature KHÁC, sau này — tra cứu "chuyện này có ai quyết chưa" trên toàn xưởng |
| **Phạm vi** | 1 file duy nhất — không có sổ tra cứu chéo, không ai ngoài feature đó biết `D2` này là gì | Toàn bộ `.bee/decisions.jsonl` — sổ chung của cả xưởng, mọi feature cộng dồn vào 1 file |
| **Sống bao lâu** | Từ lúc feature mở tới lúc feature đóng (thực tế chỉ còn ý nghĩa trong lúc còn làm feature đó) | Vĩnh viễn, append-only, không xoá |
| **Ví dụ cụ thể** | "Lúc explore `work-graph-intelligence`, nhóm chốt D2: dùng typed-edge graph — chỉ ai đang làm feature này cần biết" | "Feature A (2026-07-10) chốt 'runner là người ghi duy nhất' — 2 tháng sau feature B không liên quan vẫn tra được câu này qua `.bee/decisions.jsonl` hoặc thấy trích trong 1 spec" |

Ẩn dụ ngắn: **D-local = sticky-note dán trong hồ sơ RIÊNG của 1 việc**
(không ai ngoài việc đó đọc); **D-hex = sổ nhật ký CHUNG của cả xưởng**
(ai cũng tra được, mọi việc đều ghi vào).

**ADR (#4) khác cả hai** — không phải "ai ghi lúc nào" mà là **bản tuyển
chọn tay**: 1 người (không phải máy) đọc lại D-hex, chọn RA những quyết định
product-facing đã chốt hẳn, viết lại thành văn xuôi chuẩn cho người NGOÀI
xưởng (không biết bee, không đọc được `.bee/`) hiểu được sản phẩm. Không
phải mọi D-hex đều thành ADR — `0000-index.md:40-64` liệt kê nhiều D-hex
"ngoài phạm vi" (không bao giờ lên ADR).

**Chốt (STR47, `docs/decisions/0017-dong-audit-he-id-ten-goi.md`):** #7 và #8 dùng chung chữ `D`
dù khác phạm vi — thay vì đổi tên (`L<n>`) hay bỏ hẳn bảng cục bộ, luật
được khoá là: **D-local KHÔNG BAO GIỜ được trích dẫn ngoài file `CONTEXT.md`
gốc của nó.** Chi phí migrate = 0 (không sửa `decisions.mjs`, không sửa
`CONTEXT.md` nào đang có); D-local vốn đã single-file trong thực tế, rủi ro
thật chỉ là kỷ luật trích dẫn — luật này đóng đúng rủi ro đó. Theo khung
§Bối-cảnh (bee = giàn giáo tạm), việc này không cần đầu tư sâu hơn.
````

Target: `docs/platform/documentation/history/id-systems-audit.md#5-7-d-hex-và-8-d-local-của-lĩnh-vực-gì-ai-dùng-và-luật-citation-chốt`
Target unit SHA256: `3b7c5596e7cb831ddd5f4cbba55ae2ed2ec0de0a1a73fbd35aeb9a9583d7c703`
Shown target SHA256: `0fcea1ce9e16ff1ad9569ce7adbc63512befc1a8e29193c4c75a6905895b225d`

````text
## 5 · #7 D-hex và #8 D-local — của lĩnh vực gì, ai dùng, và luật citation chốt

Cả hai đều là id của **1 câu quyết định** (không phải id của feature, PBI,
hay cell) — nhưng khác nhau ở **AI ghi / AI đọc / phạm vi bao xa**:

| | #8 D-local (`D<n>`) | #7 D-hex global |
|---|---|---|
| **Ghi khi nào** | Lúc bàn/khám phá **1 feature cụ thể** (bee-exploring), điền vào bảng "Locked Decisions" của CHÍNH file `CONTEXT.md` feature đó | Bất cứ lúc nào, bất cứ feature nào, bất cứ phase nào (explore/plan/execute/review) — qua lệnh `bee decisions log` |
| **Đọc bởi ai** | Chỉ người/agent làm TIẾP feature đó (cùng phiên hoặc phiên resume sau) — mở lại đúng file CONTEXT.md đó | Bất kỳ agent nào, feature KHÁC, sau này — tra cứu "chuyện này có ai quyết chưa" trên toàn xưởng |
| **Phạm vi** | 1 file duy nhất — không có sổ tra cứu chéo, không ai ngoài feature đó biết `D2` này là gì | Toàn bộ `.bee/decisions.jsonl` — sổ chung của cả xưởng, mọi feature cộng dồn vào 1 file |
| **Sống bao lâu** | Từ lúc feature mở tới lúc feature đóng (thực tế chỉ còn ý nghĩa trong lúc còn làm feature đó) | Vĩnh viễn, append-only, không xoá |
| **Ví dụ cụ thể** | "Lúc explore `work-graph-intelligence`, nhóm chốt D2: dùng typed-edge graph — chỉ ai đang làm feature này cần biết" | "Feature A (2026-07-10) chốt 'runner là người ghi duy nhất' — 2 tháng sau feature B không liên quan vẫn tra được câu này qua `.bee/decisions.jsonl` hoặc thấy trích trong 1 spec" |

Ẩn dụ ngắn: **D-local = sticky-note dán trong hồ sơ RIÊNG của 1 việc**
(không ai ngoài việc đó đọc); **D-hex = sổ nhật ký CHUNG của cả xưởng**
(ai cũng tra được, mọi việc đều ghi vào).

**ADR (#4) khác cả hai** — không phải "ai ghi lúc nào" mà là **bản tuyển
chọn tay**: 1 người (không phải máy) đọc lại D-hex, chọn RA những quyết định
product-facing đã chốt hẳn, viết lại thành văn xuôi chuẩn cho người NGOÀI
xưởng (không biết bee, không đọc được `.bee/`) hiểu được sản phẩm. Không
phải mọi D-hex đều thành ADR — `0000-index.md:40-64` liệt kê nhiều D-hex
"ngoài phạm vi" (không bao giờ lên ADR).

**Chốt (STR47, `docs/decisions/0017-dong-audit-he-id-ten-goi.md`):** #7 và #8 dùng chung chữ `D`
dù khác phạm vi — thay vì đổi tên (`L<n>`) hay bỏ hẳn bảng cục bộ, luật
được khoá là: **D-local KHÔNG BAO GIỜ được trích dẫn ngoài file `CONTEXT.md`
gốc của nó.** Chi phí migrate = 0 (không sửa `decisions.mjs`, không sửa
`CONTEXT.md` nào đang có); D-local vốn đã single-file trong thực tế, rủi ro
thật chỉ là kỷ luật trích dẫn — luật này đóng đúng rủi ro đó. Theo khung
§Bối-cảnh (bee = giàn giáo tạm), việc này không cần đầu tư sâu hơn.
````

````diff

````
## source-decision claim_e14bf4b7896771128b4d6e9454173b61

Decision:

````json
{
  "claimId": "claim_e14bf4b7896771128b4d6e9454173b61",
  "sourceUnitDigest": "503e53116fb3aad46b4e37e4526ee8343b636b56b208dd38495d22dad2fe155a",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "unheaded-block-14",
  "targetUnitDigest": "503e53116fb3aad46b4e37e4526ee8343b636b56b208dd38495d22dad2fe155a",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã",
    "5 · #7 D-hex và #8 D-local — của lĩnh vực gì, ai dùng, và luật citation chốt"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#unheaded-block-14 to docs/platform/documentation/history/id-systems-audit.md#unheaded-block-14. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#unheaded-block-14`
Source unit SHA256: `503e53116fb3aad46b4e37e4526ee8343b636b56b208dd38495d22dad2fe155a`
Shown source SHA256: `503e53116fb3aad46b4e37e4526ee8343b636b56b208dd38495d22dad2fe155a`

````text
Cả hai đều là id của **1 câu quyết định** (không phải id của feature, PBI,
hay cell) — nhưng khác nhau ở **AI ghi / AI đọc / phạm vi bao xa**:
````

Target: `docs/platform/documentation/history/id-systems-audit.md#unheaded-block-14`
Target unit SHA256: `503e53116fb3aad46b4e37e4526ee8343b636b56b208dd38495d22dad2fe155a`
Shown target SHA256: `503e53116fb3aad46b4e37e4526ee8343b636b56b208dd38495d22dad2fe155a`

````text
Cả hai đều là id của **1 câu quyết định** (không phải id của feature, PBI,
hay cell) — nhưng khác nhau ở **AI ghi / AI đọc / phạm vi bao xa**:
````

````diff

````
## source-decision claim_f4f418da7bf17ec37d90217f1108968a

Decision:

````json
{
  "claimId": "claim_f4f418da7bf17ec37d90217f1108968a",
  "sourceUnitDigest": "c426e2dfcf97737aafb9268a0ba7bfee8ce972184c7f8a4b76556af05495735f",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "unheaded-block-15",
  "targetUnitDigest": "c426e2dfcf97737aafb9268a0ba7bfee8ce972184c7f8a4b76556af05495735f",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã",
    "5 · #7 D-hex và #8 D-local — của lĩnh vực gì, ai dùng, và luật citation chốt"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#unheaded-block-15 to docs/platform/documentation/history/id-systems-audit.md#unheaded-block-15. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#unheaded-block-15`
Source unit SHA256: `c426e2dfcf97737aafb9268a0ba7bfee8ce972184c7f8a4b76556af05495735f`
Shown source SHA256: `c426e2dfcf97737aafb9268a0ba7bfee8ce972184c7f8a4b76556af05495735f`

````text
| | #8 D-local (`D<n>`) | #7 D-hex global |
|---|---|---|
| **Ghi khi nào** | Lúc bàn/khám phá **1 feature cụ thể** (bee-exploring), điền vào bảng "Locked Decisions" của CHÍNH file `CONTEXT.md` feature đó | Bất cứ lúc nào, bất cứ feature nào, bất cứ phase nào (explore/plan/execute/review) — qua lệnh `bee decisions log` |
| **Đọc bởi ai** | Chỉ người/agent làm TIẾP feature đó (cùng phiên hoặc phiên resume sau) — mở lại đúng file CONTEXT.md đó | Bất kỳ agent nào, feature KHÁC, sau này — tra cứu "chuyện này có ai quyết chưa" trên toàn xưởng |
| **Phạm vi** | 1 file duy nhất — không có sổ tra cứu chéo, không ai ngoài feature đó biết `D2` này là gì | Toàn bộ `.bee/decisions.jsonl` — sổ chung của cả xưởng, mọi feature cộng dồn vào 1 file |
| **Sống bao lâu** | Từ lúc feature mở tới lúc feature đóng (thực tế chỉ còn ý nghĩa trong lúc còn làm feature đó) | Vĩnh viễn, append-only, không xoá |
| **Ví dụ cụ thể** | "Lúc explore `work-graph-intelligence`, nhóm chốt D2: dùng typed-edge graph — chỉ ai đang làm feature này cần biết" | "Feature A (2026-07-10) chốt 'runner là người ghi duy nhất' — 2 tháng sau feature B không liên quan vẫn tra được câu này qua `.bee/decisions.jsonl` hoặc thấy trích trong 1 spec" |
````

Target: `docs/platform/documentation/history/id-systems-audit.md#unheaded-block-15`
Target unit SHA256: `c426e2dfcf97737aafb9268a0ba7bfee8ce972184c7f8a4b76556af05495735f`
Shown target SHA256: `c426e2dfcf97737aafb9268a0ba7bfee8ce972184c7f8a4b76556af05495735f`

````text
| | #8 D-local (`D<n>`) | #7 D-hex global |
|---|---|---|
| **Ghi khi nào** | Lúc bàn/khám phá **1 feature cụ thể** (bee-exploring), điền vào bảng "Locked Decisions" của CHÍNH file `CONTEXT.md` feature đó | Bất cứ lúc nào, bất cứ feature nào, bất cứ phase nào (explore/plan/execute/review) — qua lệnh `bee decisions log` |
| **Đọc bởi ai** | Chỉ người/agent làm TIẾP feature đó (cùng phiên hoặc phiên resume sau) — mở lại đúng file CONTEXT.md đó | Bất kỳ agent nào, feature KHÁC, sau này — tra cứu "chuyện này có ai quyết chưa" trên toàn xưởng |
| **Phạm vi** | 1 file duy nhất — không có sổ tra cứu chéo, không ai ngoài feature đó biết `D2` này là gì | Toàn bộ `.bee/decisions.jsonl` — sổ chung của cả xưởng, mọi feature cộng dồn vào 1 file |
| **Sống bao lâu** | Từ lúc feature mở tới lúc feature đóng (thực tế chỉ còn ý nghĩa trong lúc còn làm feature đó) | Vĩnh viễn, append-only, không xoá |
| **Ví dụ cụ thể** | "Lúc explore `work-graph-intelligence`, nhóm chốt D2: dùng typed-edge graph — chỉ ai đang làm feature này cần biết" | "Feature A (2026-07-10) chốt 'runner là người ghi duy nhất' — 2 tháng sau feature B không liên quan vẫn tra được câu này qua `.bee/decisions.jsonl` hoặc thấy trích trong 1 spec" |
````

````diff

````
## source-decision claim_df830959e53835a05abb22145b44f6e8

Decision:

````json
{
  "claimId": "claim_df830959e53835a05abb22145b44f6e8",
  "sourceUnitDigest": "ecf22253813b9fca0966571a9ce1b72a15e49e2acfd26bed53e4af6786069d9c",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "unheaded-block-16",
  "targetUnitDigest": "ecf22253813b9fca0966571a9ce1b72a15e49e2acfd26bed53e4af6786069d9c",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã",
    "5 · #7 D-hex và #8 D-local — của lĩnh vực gì, ai dùng, và luật citation chốt"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#unheaded-block-16 to docs/platform/documentation/history/id-systems-audit.md#unheaded-block-16. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#unheaded-block-16`
Source unit SHA256: `ecf22253813b9fca0966571a9ce1b72a15e49e2acfd26bed53e4af6786069d9c`
Shown source SHA256: `ecf22253813b9fca0966571a9ce1b72a15e49e2acfd26bed53e4af6786069d9c`

````text
Ẩn dụ ngắn: **D-local = sticky-note dán trong hồ sơ RIÊNG của 1 việc**
(không ai ngoài việc đó đọc); **D-hex = sổ nhật ký CHUNG của cả xưởng**
(ai cũng tra được, mọi việc đều ghi vào).
````

Target: `docs/platform/documentation/history/id-systems-audit.md#unheaded-block-16`
Target unit SHA256: `ecf22253813b9fca0966571a9ce1b72a15e49e2acfd26bed53e4af6786069d9c`
Shown target SHA256: `ecf22253813b9fca0966571a9ce1b72a15e49e2acfd26bed53e4af6786069d9c`

````text
Ẩn dụ ngắn: **D-local = sticky-note dán trong hồ sơ RIÊNG của 1 việc**
(không ai ngoài việc đó đọc); **D-hex = sổ nhật ký CHUNG của cả xưởng**
(ai cũng tra được, mọi việc đều ghi vào).
````

````diff

````
## source-decision claim_bbbc3c5de574380b7ad921d59d5e6188

Decision:

````json
{
  "claimId": "claim_bbbc3c5de574380b7ad921d59d5e6188",
  "sourceUnitDigest": "c2450adadf0a168a04ddb63e83662dcc0f282febee65d5e138751115e4c8dbec",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "unheaded-block-17",
  "targetUnitDigest": "c2450adadf0a168a04ddb63e83662dcc0f282febee65d5e138751115e4c8dbec",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã",
    "5 · #7 D-hex và #8 D-local — của lĩnh vực gì, ai dùng, và luật citation chốt"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#unheaded-block-17 to docs/platform/documentation/history/id-systems-audit.md#unheaded-block-17. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#unheaded-block-17`
Source unit SHA256: `c2450adadf0a168a04ddb63e83662dcc0f282febee65d5e138751115e4c8dbec`
Shown source SHA256: `c2450adadf0a168a04ddb63e83662dcc0f282febee65d5e138751115e4c8dbec`

````text
**ADR (#4) khác cả hai** — không phải "ai ghi lúc nào" mà là **bản tuyển
chọn tay**: 1 người (không phải máy) đọc lại D-hex, chọn RA những quyết định
product-facing đã chốt hẳn, viết lại thành văn xuôi chuẩn cho người NGOÀI
xưởng (không biết bee, không đọc được `.bee/`) hiểu được sản phẩm. Không
phải mọi D-hex đều thành ADR — `0000-index.md:40-64` liệt kê nhiều D-hex
"ngoài phạm vi" (không bao giờ lên ADR).
````

Target: `docs/platform/documentation/history/id-systems-audit.md#unheaded-block-17`
Target unit SHA256: `c2450adadf0a168a04ddb63e83662dcc0f282febee65d5e138751115e4c8dbec`
Shown target SHA256: `c2450adadf0a168a04ddb63e83662dcc0f282febee65d5e138751115e4c8dbec`

````text
**ADR (#4) khác cả hai** — không phải "ai ghi lúc nào" mà là **bản tuyển
chọn tay**: 1 người (không phải máy) đọc lại D-hex, chọn RA những quyết định
product-facing đã chốt hẳn, viết lại thành văn xuôi chuẩn cho người NGOÀI
xưởng (không biết bee, không đọc được `.bee/`) hiểu được sản phẩm. Không
phải mọi D-hex đều thành ADR — `0000-index.md:40-64` liệt kê nhiều D-hex
"ngoài phạm vi" (không bao giờ lên ADR).
````

````diff

````
## source-decision claim_e75b86087f09f65a60aa725afb863cd8

Decision:

````json
{
  "claimId": "claim_e75b86087f09f65a60aa725afb863cd8",
  "sourceUnitDigest": "7b93bfa4feafbd3f8c428a890272bc613d95c22a249239d7caf416375be5ea53",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "unheaded-block-18",
  "targetUnitDigest": "7b93bfa4feafbd3f8c428a890272bc613d95c22a249239d7caf416375be5ea53",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã",
    "5 · #7 D-hex và #8 D-local — của lĩnh vực gì, ai dùng, và luật citation chốt"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#unheaded-block-18 to docs/platform/documentation/history/id-systems-audit.md#unheaded-block-18. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#unheaded-block-18`
Source unit SHA256: `7b93bfa4feafbd3f8c428a890272bc613d95c22a249239d7caf416375be5ea53`
Shown source SHA256: `7b93bfa4feafbd3f8c428a890272bc613d95c22a249239d7caf416375be5ea53`

````text
**Chốt (STR47, `docs/decisions/0017-dong-audit-he-id-ten-goi.md`):** #7 và #8 dùng chung chữ `D`
dù khác phạm vi — thay vì đổi tên (`L<n>`) hay bỏ hẳn bảng cục bộ, luật
được khoá là: **D-local KHÔNG BAO GIỜ được trích dẫn ngoài file `CONTEXT.md`
gốc của nó.** Chi phí migrate = 0 (không sửa `decisions.mjs`, không sửa
`CONTEXT.md` nào đang có); D-local vốn đã single-file trong thực tế, rủi ro
thật chỉ là kỷ luật trích dẫn — luật này đóng đúng rủi ro đó. Theo khung
§Bối-cảnh (bee = giàn giáo tạm), việc này không cần đầu tư sâu hơn.
````

Target: `docs/platform/documentation/history/id-systems-audit.md#unheaded-block-18`
Target unit SHA256: `7b93bfa4feafbd3f8c428a890272bc613d95c22a249239d7caf416375be5ea53`
Shown target SHA256: `7b93bfa4feafbd3f8c428a890272bc613d95c22a249239d7caf416375be5ea53`

````text
**Chốt (STR47, `docs/decisions/0017-dong-audit-he-id-ten-goi.md`):** #7 và #8 dùng chung chữ `D`
dù khác phạm vi — thay vì đổi tên (`L<n>`) hay bỏ hẳn bảng cục bộ, luật
được khoá là: **D-local KHÔNG BAO GIỜ được trích dẫn ngoài file `CONTEXT.md`
gốc của nó.** Chi phí migrate = 0 (không sửa `decisions.mjs`, không sửa
`CONTEXT.md` nào đang có); D-local vốn đã single-file trong thực tế, rủi ro
thật chỉ là kỷ luật trích dẫn — luật này đóng đúng rủi ro đó. Theo khung
§Bối-cảnh (bee = giàn giáo tạm), việc này không cần đầu tư sâu hơn.
````

````diff

````
## source-decision claim_5d82d105535c6822672b28b4c4f0c03d

Decision:

````json
{
  "claimId": "claim_5d82d105535c6822672b28b4c4f0c03d",
  "sourceUnitDigest": "8eaef6f5a2ec819dad8de87b8bb9e15c0d105b3d993869bd088fe312b64c437e",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "6-câu-hỏi-đã-đóng",
  "targetUnitDigest": "8eaef6f5a2ec819dad8de87b8bb9e15c0d105b3d993869bd088fe312b64c437e",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#6-câu-hỏi-đã-đóng to docs/platform/documentation/history/id-systems-audit.md#6-câu-hỏi-đã-đóng. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#6-câu-hỏi-đã-đóng`
Source unit SHA256: `8eaef6f5a2ec819dad8de87b8bb9e15c0d105b3d993869bd088fe312b64c437e`
Shown source SHA256: `d65115aa661b1a1ca9fad5d439179c7e45302d7f6e9073f07280ea4ef9957ac4`

````text
## 6 · Câu hỏi đã đóng

Cả 5 câu hỏi mở của bản DRAFT 2026-07-18 đã chốt — xem `docs/decisions/0017-dong-audit-he-id-ten-goi.md` để có đầy đủ bằng chứng:

1. ~~`D<n>` local (#8) vs D-hex (#7) — chọn hướng nào?~~ → §5: luật citation, không rename.
2. ~~cell-id (#9) và feature slug (#10) — chưa bàn.~~ → §1, §4: giữ nguyên cả hai, convention-scoped đã đủ.
3. ~~Phụ lục boundary cuối cùng đặt ở đâu?~~ → `docs/architecture-map.md` (Phụ lục B), không phải `reading-map.md` (locator thuần, không host nội dung).
4. ~~`R#`→`RUL<n>` migration scope/sequencing?~~ → Moot — STR56 đã thi công xong.
5. ~~Đã đủ rõ để chuyển sang lập plan thi công chưa?~~ → Đã chuyển và đã xong: STR53/54/55/56/57/58 tất cả `done`.

---

Nguồn: `repo/docs/backlog.md` STR47 (+ STR53-STR58) + thảo luận 2026-07-18 +
đóng audit 2026-07-27 (`docs/decisions/0017-dong-audit-he-id-ten-goi.md`). Bằng chứng đọc trực
tiếp: `src/intake/classify.mjs`, `src/intake/decompose.mjs`,
`src/state/work.mjs`, `src/state/store.mjs`, `.bee/bin/lib/cells.mjs`,
`.bee/bin/lib/decisions.mjs`, `docs/architecture-map.md`,
`docs/specs/reading-map.md`, `docs/specs/runner.md`,
`docs/decisions/0000-index.md`, `docs/decisions/0004-pham-vi-va-non-goal.md`,
`.claude/skills/bee-*/references/*.md`, `.bee/decisions.jsonl`,
`.bee/backlog.jsonl`, và các `docs/history/*/CONTEXT.md` liên quan.
````

Target: `docs/platform/documentation/history/id-systems-audit.md#6-câu-hỏi-đã-đóng`
Target unit SHA256: `8eaef6f5a2ec819dad8de87b8bb9e15c0d105b3d993869bd088fe312b64c437e`
Shown target SHA256: `d65115aa661b1a1ca9fad5d439179c7e45302d7f6e9073f07280ea4ef9957ac4`

````text
## 6 · Câu hỏi đã đóng

Cả 5 câu hỏi mở của bản DRAFT 2026-07-18 đã chốt — xem `docs/decisions/0017-dong-audit-he-id-ten-goi.md` để có đầy đủ bằng chứng:

1. ~~`D<n>` local (#8) vs D-hex (#7) — chọn hướng nào?~~ → §5: luật citation, không rename.
2. ~~cell-id (#9) và feature slug (#10) — chưa bàn.~~ → §1, §4: giữ nguyên cả hai, convention-scoped đã đủ.
3. ~~Phụ lục boundary cuối cùng đặt ở đâu?~~ → `docs/architecture-map.md` (Phụ lục B), không phải `reading-map.md` (locator thuần, không host nội dung).
4. ~~`R#`→`RUL<n>` migration scope/sequencing?~~ → Moot — STR56 đã thi công xong.
5. ~~Đã đủ rõ để chuyển sang lập plan thi công chưa?~~ → Đã chuyển và đã xong: STR53/54/55/56/57/58 tất cả `done`.

---

Nguồn: `repo/docs/backlog.md` STR47 (+ STR53-STR58) + thảo luận 2026-07-18 +
đóng audit 2026-07-27 (`docs/decisions/0017-dong-audit-he-id-ten-goi.md`). Bằng chứng đọc trực
tiếp: `src/intake/classify.mjs`, `src/intake/decompose.mjs`,
`src/state/work.mjs`, `src/state/store.mjs`, `.bee/bin/lib/cells.mjs`,
`.bee/bin/lib/decisions.mjs`, `docs/architecture-map.md`,
`docs/specs/reading-map.md`, `docs/specs/runner.md`,
`docs/decisions/0000-index.md`, `docs/decisions/0004-pham-vi-va-non-goal.md`,
`.claude/skills/bee-*/references/*.md`, `.bee/decisions.jsonl`,
`.bee/backlog.jsonl`, và các `docs/history/*/CONTEXT.md` liên quan.
````

````diff

````
## source-decision claim_65828cbb70c075711ad1183135f0ff4e

Decision:

````json
{
  "claimId": "claim_65828cbb70c075711ad1183135f0ff4e",
  "sourceUnitDigest": "76e725ec64de6f99f56b2a73c3369abc49f8e927259d32853c9fbefb4fe765c2",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "unheaded-block-19",
  "targetUnitDigest": "76e725ec64de6f99f56b2a73c3369abc49f8e927259d32853c9fbefb4fe765c2",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã",
    "6 · Câu hỏi đã đóng"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#unheaded-block-19 to docs/platform/documentation/history/id-systems-audit.md#unheaded-block-19. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#unheaded-block-19`
Source unit SHA256: `76e725ec64de6f99f56b2a73c3369abc49f8e927259d32853c9fbefb4fe765c2`
Shown source SHA256: `76e725ec64de6f99f56b2a73c3369abc49f8e927259d32853c9fbefb4fe765c2`

````text
Cả 5 câu hỏi mở của bản DRAFT 2026-07-18 đã chốt — xem `docs/decisions/0017-dong-audit-he-id-ten-goi.md` để có đầy đủ bằng chứng:
````

Target: `docs/platform/documentation/history/id-systems-audit.md#unheaded-block-19`
Target unit SHA256: `76e725ec64de6f99f56b2a73c3369abc49f8e927259d32853c9fbefb4fe765c2`
Shown target SHA256: `76e725ec64de6f99f56b2a73c3369abc49f8e927259d32853c9fbefb4fe765c2`

````text
Cả 5 câu hỏi mở của bản DRAFT 2026-07-18 đã chốt — xem `docs/decisions/0017-dong-audit-he-id-ten-goi.md` để có đầy đủ bằng chứng:
````

````diff

````
## source-decision claim_dbcf57bec8a0f461b157c6e417432cf6

Decision:

````json
{
  "claimId": "claim_dbcf57bec8a0f461b157c6e417432cf6",
  "sourceUnitDigest": "ed6bf9610ce7b6e78f84c9a9cf07aea85cf7926c4bef22f533b32db9e8915941",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "unheaded-block-20",
  "targetUnitDigest": "ed6bf9610ce7b6e78f84c9a9cf07aea85cf7926c4bef22f533b32db9e8915941",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã",
    "6 · Câu hỏi đã đóng"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#unheaded-block-20 to docs/platform/documentation/history/id-systems-audit.md#unheaded-block-20. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#unheaded-block-20`
Source unit SHA256: `ed6bf9610ce7b6e78f84c9a9cf07aea85cf7926c4bef22f533b32db9e8915941`
Shown source SHA256: `ed6bf9610ce7b6e78f84c9a9cf07aea85cf7926c4bef22f533b32db9e8915941`

````text
1. ~~`D<n>` local (#8) vs D-hex (#7) — chọn hướng nào?~~ → §5: luật citation, không rename.
2. ~~cell-id (#9) và feature slug (#10) — chưa bàn.~~ → §1, §4: giữ nguyên cả hai, convention-scoped đã đủ.
3. ~~Phụ lục boundary cuối cùng đặt ở đâu?~~ → `docs/architecture-map.md` (Phụ lục B), không phải `reading-map.md` (locator thuần, không host nội dung).
4. ~~`R#`→`RUL<n>` migration scope/sequencing?~~ → Moot — STR56 đã thi công xong.
5. ~~Đã đủ rõ để chuyển sang lập plan thi công chưa?~~ → Đã chuyển và đã xong: STR53/54/55/56/57/58 tất cả `done`.

---
````

Target: `docs/platform/documentation/history/id-systems-audit.md#unheaded-block-20`
Target unit SHA256: `ed6bf9610ce7b6e78f84c9a9cf07aea85cf7926c4bef22f533b32db9e8915941`
Shown target SHA256: `ed6bf9610ce7b6e78f84c9a9cf07aea85cf7926c4bef22f533b32db9e8915941`

````text
1. ~~`D<n>` local (#8) vs D-hex (#7) — chọn hướng nào?~~ → §5: luật citation, không rename.
2. ~~cell-id (#9) và feature slug (#10) — chưa bàn.~~ → §1, §4: giữ nguyên cả hai, convention-scoped đã đủ.
3. ~~Phụ lục boundary cuối cùng đặt ở đâu?~~ → `docs/architecture-map.md` (Phụ lục B), không phải `reading-map.md` (locator thuần, không host nội dung).
4. ~~`R#`→`RUL<n>` migration scope/sequencing?~~ → Moot — STR56 đã thi công xong.
5. ~~Đã đủ rõ để chuyển sang lập plan thi công chưa?~~ → Đã chuyển và đã xong: STR53/54/55/56/57/58 tất cả `done`.

---
````

````diff

````
## source-decision claim_dab02d6084f479c503efe1d42a96633b

Decision:

````json
{
  "claimId": "claim_dab02d6084f479c503efe1d42a96633b",
  "sourceUnitDigest": "620cc5608fb805e0e143e04503789e745079a925c02cd308abe8f3d5cd0f061b",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "unheaded-block-21",
  "targetUnitDigest": "620cc5608fb805e0e143e04503789e745079a925c02cd308abe8f3d5cd0f061b",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã",
    "6 · Câu hỏi đã đóng"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#unheaded-block-21 to docs/platform/documentation/history/id-systems-audit.md#unheaded-block-21. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#unheaded-block-21`
Source unit SHA256: `620cc5608fb805e0e143e04503789e745079a925c02cd308abe8f3d5cd0f061b`
Shown source SHA256: `620cc5608fb805e0e143e04503789e745079a925c02cd308abe8f3d5cd0f061b`

````text
Nguồn: `repo/docs/backlog.md` STR47 (+ STR53-STR58) + thảo luận 2026-07-18 +
đóng audit 2026-07-27 (`docs/decisions/0017-dong-audit-he-id-ten-goi.md`). Bằng chứng đọc trực
tiếp: `src/intake/classify.mjs`, `src/intake/decompose.mjs`,
`src/state/work.mjs`, `src/state/store.mjs`, `.bee/bin/lib/cells.mjs`,
`.bee/bin/lib/decisions.mjs`, `docs/architecture-map.md`,
`docs/specs/reading-map.md`, `docs/specs/runner.md`,
`docs/decisions/0000-index.md`, `docs/decisions/0004-pham-vi-va-non-goal.md`,
`.claude/skills/bee-*/references/*.md`, `.bee/decisions.jsonl`,
`.bee/backlog.jsonl`, và các `docs/history/*/CONTEXT.md` liên quan.
````

Target: `docs/platform/documentation/history/id-systems-audit.md#unheaded-block-21`
Target unit SHA256: `620cc5608fb805e0e143e04503789e745079a925c02cd308abe8f3d5cd0f061b`
Shown target SHA256: `620cc5608fb805e0e143e04503789e745079a925c02cd308abe8f3d5cd0f061b`

````text
Nguồn: `repo/docs/backlog.md` STR47 (+ STR53-STR58) + thảo luận 2026-07-18 +
đóng audit 2026-07-27 (`docs/decisions/0017-dong-audit-he-id-ten-goi.md`). Bằng chứng đọc trực
tiếp: `src/intake/classify.mjs`, `src/intake/decompose.mjs`,
`src/state/work.mjs`, `src/state/store.mjs`, `.bee/bin/lib/cells.mjs`,
`.bee/bin/lib/decisions.mjs`, `docs/architecture-map.md`,
`docs/specs/reading-map.md`, `docs/specs/runner.md`,
`docs/decisions/0000-index.md`, `docs/decisions/0004-pham-vi-va-non-goal.md`,
`.claude/skills/bee-*/references/*.md`, `.bee/decisions.jsonl`,
`.bee/backlog.jsonl`, và các `docs/history/*/CONTEXT.md` liên quan.
````

````diff

````
## source-decision claim_f7d1f5daf50bff9eba5dce70ba5aab85

Decision:

````json
{
  "claimId": "claim_f7d1f5daf50bff9eba5dce70ba5aab85",
  "sourceUnitDigest": "2c8da1aaf11c47583d7e43abde118b2616ad08ed947ada803e7717c3f55964c3",
  "targetOwner": "docs/platform/herdr-web-dashboard/operations/operator-runbook.md",
  "targetAnchor": "operator-runbook-herdr-cockpit",
  "targetUnitDigest": "bd53ab9a9c785423e4a7ad85ef6ccb26b610d762fab9f1ea57b1d031a24b130b",
  "targetAncestry": [],
  "claimKind": "procedure",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/operator-runbook-herdr-cockpit.md#operator-runbook-herdr-cockpit to docs/platform/herdr-web-dashboard/operations/operator-runbook.md#operator-runbook-herdr-cockpit. Carry the complete unit into its candidate guide / runbook owner. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/operator-runbook-herdr-cockpit.md#operator-runbook-herdr-cockpit`
Source unit SHA256: `2c8da1aaf11c47583d7e43abde118b2616ad08ed947ada803e7717c3f55964c3`
Shown source SHA256: `1bd2fca82520d13c5747e9aabebdabbb78afdfe1481d1b91a4bca5a3a1fb8d5e`

````text
# Operator runbook — herdr cockpit

The official fgOS operator cockpit (STR40 / decision D d3dbe7f5 — its hard-law clause re-scoped 2026-09-06 by decision "RUL40 re-scope" (scope runner, supersedes d3dbe7f5; see docs/specs/runner.md RUL40) — which itself supersedes the
earlier tmux-based D ef6ed305). herdr arranges panes; every pane runs the
real fgOS CLI standalone — herdr is chrome, not a brain.
````

Target: `docs/platform/herdr-web-dashboard/operations/operator-runbook.md#operator-runbook-herdr-cockpit`
Target unit SHA256: `bd53ab9a9c785423e4a7ad85ef6ccb26b610d762fab9f1ea57b1d031a24b130b`
Shown target SHA256: `f1505b2dec6d0a60ff8499ebe68bf273dd57c5e4f1ce97798be78a7bf1c94757`

````text
# Operator runbook — herdr cockpit

```txt
Document type: Guide / Runbook
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve the mapped source as candidate material for conservation review
Design status: Candidate
Implementation: Historical source retained; current truth not certified
Provenance: docs/operator-runbook-herdr-cockpit.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing conservation of the mapped legacy source
Do not use this for: Current canonical authority or proof of implemented behavior
Last reviewed: 2026-10-14
Related:
- docs/operator-runbook-herdr-cockpit.md
Supersedes: None; candidate only
Superseded by: None
```

The official fgOS operator cockpit (STR40 / decision D d3dbe7f5 — its hard-law clause re-scoped 2026-09-06 by decision "RUL40 re-scope" (scope runner, supersedes d3dbe7f5; see docs/specs/runner.md RUL40) — which itself supersedes the
earlier tmux-based D ef6ed305). herdr arranges panes; every pane runs the
real fgOS CLI standalone — herdr is chrome, not a brain.
````

````diff
--- docs/operator-runbook-herdr-cockpit.md
+++ docs/platform/herdr-web-dashboard/operations/operator-runbook.md
@@ -1,0 +2,19 @@
+
+```txt
+Document type: Guide / Runbook
+Audience: Documentation migration reviewer, maintainer, agent
+Purpose: Preserve the mapped source as candidate material for conservation review
+Design status: Candidate
+Implementation: Historical source retained; current truth not certified
+Provenance: docs/operator-runbook-herdr-cockpit.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
+Writer type: Agent draft writer
+Canonical: No
+Canonical for: None; candidate only
+Use this when: Reviewing conservation of the mapped legacy source
+Do not use this for: Current canonical authority or proof of implemented behavior
+Last reviewed: 2026-10-14
+Related:
+- docs/operator-runbook-herdr-cockpit.md
+Supersedes: None; candidate only
+Superseded by: None
+```
````
## source-decision claim_00fa6ccb974073d6a5956901e3d216dc

Decision:

````json
{
  "claimId": "claim_00fa6ccb974073d6a5956901e3d216dc",
  "sourceUnitDigest": "681998fc48ddf2b1a16693b13fde4ce04a93ce726baf676187bb398173d13df2",
  "targetOwner": "docs/platform/herdr-web-dashboard/operations/operator-runbook.md",
  "targetAnchor": "unheaded-block-2",
  "targetUnitDigest": "681998fc48ddf2b1a16693b13fde4ce04a93ce726baf676187bb398173d13df2",
  "targetAncestry": [
    "Operator runbook — herdr cockpit"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/operator-runbook-herdr-cockpit.md#unheaded-block-1 to docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-2. Carry the complete unit into its candidate guide / runbook owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/operator-runbook-herdr-cockpit.md#unheaded-block-1`
Source unit SHA256: `681998fc48ddf2b1a16693b13fde4ce04a93ce726baf676187bb398173d13df2`
Shown source SHA256: `681998fc48ddf2b1a16693b13fde4ce04a93ce726baf676187bb398173d13df2`

````text
The official fgOS operator cockpit (STR40 / decision D d3dbe7f5 — its hard-law clause re-scoped 2026-09-06 by decision "RUL40 re-scope" (scope runner, supersedes d3dbe7f5; see docs/specs/runner.md RUL40) — which itself supersedes the
earlier tmux-based D ef6ed305). herdr arranges panes; every pane runs the
real fgOS CLI standalone — herdr is chrome, not a brain.
````

Target: `docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-2`
Target unit SHA256: `681998fc48ddf2b1a16693b13fde4ce04a93ce726baf676187bb398173d13df2`
Shown target SHA256: `681998fc48ddf2b1a16693b13fde4ce04a93ce726baf676187bb398173d13df2`

````text
The official fgOS operator cockpit (STR40 / decision D d3dbe7f5 — its hard-law clause re-scoped 2026-09-06 by decision "RUL40 re-scope" (scope runner, supersedes d3dbe7f5; see docs/specs/runner.md RUL40) — which itself supersedes the
earlier tmux-based D ef6ed305). herdr arranges panes; every pane runs the
real fgOS CLI standalone — herdr is chrome, not a brain.
````

````diff

````
## source-decision claim_55c5c9fdaac3fc58dda9cc17283fb8d4

Decision:

````json
{
  "claimId": "claim_55c5c9fdaac3fc58dda9cc17283fb8d4",
  "sourceUnitDigest": "e8d6cfa1e6531fac7f3d14d6ada936f3597416aae5c79206f2b70201d77f1bdb",
  "targetOwner": "docs/platform/herdr-web-dashboard/operations/operator-runbook.md",
  "targetAnchor": "prerequisites",
  "targetUnitDigest": "e8d6cfa1e6531fac7f3d14d6ada936f3597416aae5c79206f2b70201d77f1bdb",
  "targetAncestry": [
    "Operator runbook — herdr cockpit"
  ],
  "claimKind": "procedure",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/operator-runbook-herdr-cockpit.md#prerequisites to docs/platform/herdr-web-dashboard/operations/operator-runbook.md#prerequisites. Carry the complete unit into its candidate guide / runbook owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/operator-runbook-herdr-cockpit.md#prerequisites`
Source unit SHA256: `e8d6cfa1e6531fac7f3d14d6ada936f3597416aae5c79206f2b70201d77f1bdb`
Shown source SHA256: `d783ec637da845ae94e75a0a97dd9fab27f88ed2b042be87b2880f660bc3d0c6`

````text
## Prerequisites

- [herdr](https://herdr.dev) installed and on `PATH`.
- Running inside a herdr-managed pane: `test "${HERDR_ENV:-}" = 1`. See
  `upstreams/herdr/SKILL.md` for how herdr exposes this to every pane it
  manages.
````

Target: `docs/platform/herdr-web-dashboard/operations/operator-runbook.md#prerequisites`
Target unit SHA256: `e8d6cfa1e6531fac7f3d14d6ada936f3597416aae5c79206f2b70201d77f1bdb`
Shown target SHA256: `d783ec637da845ae94e75a0a97dd9fab27f88ed2b042be87b2880f660bc3d0c6`

````text
## Prerequisites

- [herdr](https://herdr.dev) installed and on `PATH`.
- Running inside a herdr-managed pane: `test "${HERDR_ENV:-}" = 1`. See
  `upstreams/herdr/SKILL.md` for how herdr exposes this to every pane it
  manages.
````

````diff

````
## source-decision claim_440909deb4228817b86622f673407cf9

Decision:

````json
{
  "claimId": "claim_440909deb4228817b86622f673407cf9",
  "sourceUnitDigest": "d9a42f9c58f800959f042152ba90bf1f2e195c69657e417b42bb2d898ba85b9f",
  "targetOwner": "docs/platform/herdr-web-dashboard/operations/operator-runbook.md",
  "targetAnchor": "unheaded-block-3",
  "targetUnitDigest": "d9a42f9c58f800959f042152ba90bf1f2e195c69657e417b42bb2d898ba85b9f",
  "targetAncestry": [
    "Operator runbook — herdr cockpit",
    "Prerequisites"
  ],
  "claimKind": "verification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/operator-runbook-herdr-cockpit.md#unheaded-block-2 to docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-3. Carry the complete unit into its candidate guide / runbook owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/operator-runbook-herdr-cockpit.md#unheaded-block-2`
Source unit SHA256: `d9a42f9c58f800959f042152ba90bf1f2e195c69657e417b42bb2d898ba85b9f`
Shown source SHA256: `d9a42f9c58f800959f042152ba90bf1f2e195c69657e417b42bb2d898ba85b9f`

````text
- [herdr](https://herdr.dev) installed and on `PATH`.
- Running inside a herdr-managed pane: `test "${HERDR_ENV:-}" = 1`. See
  `upstreams/herdr/SKILL.md` for how herdr exposes this to every pane it
  manages.
````

Target: `docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-3`
Target unit SHA256: `d9a42f9c58f800959f042152ba90bf1f2e195c69657e417b42bb2d898ba85b9f`
Shown target SHA256: `d9a42f9c58f800959f042152ba90bf1f2e195c69657e417b42bb2d898ba85b9f`

````text
- [herdr](https://herdr.dev) installed and on `PATH`.
- Running inside a herdr-managed pane: `test "${HERDR_ENV:-}" = 1`. See
  `upstreams/herdr/SKILL.md` for how herdr exposes this to every pane it
  manages.
````

````diff

````
## source-decision claim_7957745de489ce6d48776fb191815be8

Decision:

````json
{
  "claimId": "claim_7957745de489ce6d48776fb191815be8",
  "sourceUnitDigest": "cdc96e0555cb882e3bf09d2d4fc8dfd800fc9bcf47b0566cb7385f3285d4c251",
  "targetOwner": "docs/platform/herdr-web-dashboard/operations/operator-runbook.md",
  "targetAnchor": "quick-start",
  "targetUnitDigest": "cdc96e0555cb882e3bf09d2d4fc8dfd800fc9bcf47b0566cb7385f3285d4c251",
  "targetAncestry": [
    "Operator runbook — herdr cockpit"
  ],
  "claimKind": "procedure",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/operator-runbook-herdr-cockpit.md#quick-start to docs/platform/herdr-web-dashboard/operations/operator-runbook.md#quick-start. Carry the complete unit into its candidate guide / runbook owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/operator-runbook-herdr-cockpit.md#quick-start`
Source unit SHA256: `cdc96e0555cb882e3bf09d2d4fc8dfd800fc9bcf47b0566cb7385f3285d4c251`
Shown source SHA256: `03f0e89b3f49d09f0d8da3e3db4cc339cadb93578f2cbbf2d36d9ffe288001de`

````text
## Quick start

From inside a herdr-managed pane, at the repo root:

```bash
bash scripts/herdr-cockpit.sh
```

This creates one new tab with 4 panes in your current workspace and prints
the attach command:

```
herdr tab focus <tab_id>
```
````

Target: `docs/platform/herdr-web-dashboard/operations/operator-runbook.md#quick-start`
Target unit SHA256: `cdc96e0555cb882e3bf09d2d4fc8dfd800fc9bcf47b0566cb7385f3285d4c251`
Shown target SHA256: `03f0e89b3f49d09f0d8da3e3db4cc339cadb93578f2cbbf2d36d9ffe288001de`

````text
## Quick start

From inside a herdr-managed pane, at the repo root:

```bash
bash scripts/herdr-cockpit.sh
```

This creates one new tab with 4 panes in your current workspace and prints
the attach command:

```
herdr tab focus <tab_id>
```
````

````diff

````
## source-decision claim_155f6f1ec7f15d9bd6100c6aff273702

Decision:

````json
{
  "claimId": "claim_155f6f1ec7f15d9bd6100c6aff273702",
  "sourceUnitDigest": "39ab65fc3b43b4d0d896c06367658a6b4a69aa5def2ab3b4e5af507c86dc401d",
  "targetOwner": "docs/platform/herdr-web-dashboard/operations/operator-runbook.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "39ab65fc3b43b4d0d896c06367658a6b4a69aa5def2ab3b4e5af507c86dc401d",
  "targetAncestry": [
    "Operator runbook — herdr cockpit",
    "Quick start"
  ],
  "claimKind": "procedure",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/operator-runbook-herdr-cockpit.md#unheaded-block-3 to docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-4. Carry the complete unit into its candidate guide / runbook owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/operator-runbook-herdr-cockpit.md#unheaded-block-3`
Source unit SHA256: `39ab65fc3b43b4d0d896c06367658a6b4a69aa5def2ab3b4e5af507c86dc401d`
Shown source SHA256: `39ab65fc3b43b4d0d896c06367658a6b4a69aa5def2ab3b4e5af507c86dc401d`

````text
From inside a herdr-managed pane, at the repo root:
````

Target: `docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-4`
Target unit SHA256: `39ab65fc3b43b4d0d896c06367658a6b4a69aa5def2ab3b4e5af507c86dc401d`
Shown target SHA256: `39ab65fc3b43b4d0d896c06367658a6b4a69aa5def2ab3b4e5af507c86dc401d`

````text
From inside a herdr-managed pane, at the repo root:
````

````diff

````
## source-decision claim_da379046cd1987e5ad3ed424b689c02d

Decision:

````json
{
  "claimId": "claim_da379046cd1987e5ad3ed424b689c02d",
  "sourceUnitDigest": "720a4ed3da3b0783cd767ef51cb08d571558c636621171f7067a32d7a6df2a83",
  "targetOwner": "docs/platform/herdr-web-dashboard/operations/operator-runbook.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "720a4ed3da3b0783cd767ef51cb08d571558c636621171f7067a32d7a6df2a83",
  "targetAncestry": [
    "Operator runbook — herdr cockpit",
    "Quick start"
  ],
  "claimKind": "procedure",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/operator-runbook-herdr-cockpit.md#unheaded-block-4 to docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-5. Carry the complete unit into its candidate guide / runbook owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/operator-runbook-herdr-cockpit.md#unheaded-block-4`
Source unit SHA256: `720a4ed3da3b0783cd767ef51cb08d571558c636621171f7067a32d7a6df2a83`
Shown source SHA256: `720a4ed3da3b0783cd767ef51cb08d571558c636621171f7067a32d7a6df2a83`

````text
```bash
bash scripts/herdr-cockpit.sh
```
````

Target: `docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-5`
Target unit SHA256: `720a4ed3da3b0783cd767ef51cb08d571558c636621171f7067a32d7a6df2a83`
Shown target SHA256: `720a4ed3da3b0783cd767ef51cb08d571558c636621171f7067a32d7a6df2a83`

````text
```bash
bash scripts/herdr-cockpit.sh
```
````

````diff

````
## source-decision claim_c590512e8ee217d5ce7571cbe87da090

Decision:

````json
{
  "claimId": "claim_c590512e8ee217d5ce7571cbe87da090",
  "sourceUnitDigest": "2de21bfa3d698bce1908e962df4fb41e2208a9dacedb5bb4d01cc46da7d8bf49",
  "targetOwner": "docs/platform/herdr-web-dashboard/operations/operator-runbook.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "2de21bfa3d698bce1908e962df4fb41e2208a9dacedb5bb4d01cc46da7d8bf49",
  "targetAncestry": [
    "Operator runbook — herdr cockpit",
    "Quick start"
  ],
  "claimKind": "procedure",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/operator-runbook-herdr-cockpit.md#unheaded-block-5 to docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-6. Carry the complete unit into its candidate guide / runbook owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/operator-runbook-herdr-cockpit.md#unheaded-block-5`
Source unit SHA256: `2de21bfa3d698bce1908e962df4fb41e2208a9dacedb5bb4d01cc46da7d8bf49`
Shown source SHA256: `2de21bfa3d698bce1908e962df4fb41e2208a9dacedb5bb4d01cc46da7d8bf49`

````text
This creates one new tab with 4 panes in your current workspace and prints
the attach command:
````

Target: `docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-6`
Target unit SHA256: `2de21bfa3d698bce1908e962df4fb41e2208a9dacedb5bb4d01cc46da7d8bf49`
Shown target SHA256: `2de21bfa3d698bce1908e962df4fb41e2208a9dacedb5bb4d01cc46da7d8bf49`

````text
This creates one new tab with 4 panes in your current workspace and prints
the attach command:
````

````diff

````
## source-decision claim_1725d5c991e7005bc00678d450ff0279

Decision:

````json
{
  "claimId": "claim_1725d5c991e7005bc00678d450ff0279",
  "sourceUnitDigest": "268389d63078c9f133aa5d6324c1e870294e3bca01a4c4cb94b1af8dd5179d31",
  "targetOwner": "docs/platform/herdr-web-dashboard/operations/operator-runbook.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "268389d63078c9f133aa5d6324c1e870294e3bca01a4c4cb94b1af8dd5179d31",
  "targetAncestry": [
    "Operator runbook — herdr cockpit",
    "Quick start"
  ],
  "claimKind": "procedure",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/operator-runbook-herdr-cockpit.md#unheaded-block-6 to docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-7. Carry the complete unit into its candidate guide / runbook owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/operator-runbook-herdr-cockpit.md#unheaded-block-6`
Source unit SHA256: `268389d63078c9f133aa5d6324c1e870294e3bca01a4c4cb94b1af8dd5179d31`
Shown source SHA256: `268389d63078c9f133aa5d6324c1e870294e3bca01a4c4cb94b1af8dd5179d31`

````text
```
herdr tab focus <tab_id>
```
````

Target: `docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-7`
Target unit SHA256: `268389d63078c9f133aa5d6324c1e870294e3bca01a4c4cb94b1af8dd5179d31`
Shown target SHA256: `268389d63078c9f133aa5d6324c1e870294e3bca01a4c4cb94b1af8dd5179d31`

````text
```
herdr tab focus <tab_id>
```
````

````diff

````
## source-decision claim_956c55c5936be71234148ac1d428f578

Decision:

````json
{
  "claimId": "claim_956c55c5936be71234148ac1d428f578",
  "sourceUnitDigest": "e0cca48c30c767de1a557525fce7013c8e1f8665bf8a74e68543beb746afae6c",
  "targetOwner": "docs/platform/herdr-web-dashboard/operations/operator-runbook.md",
  "targetAnchor": "what-each-pane-does",
  "targetUnitDigest": "e0cca48c30c767de1a557525fce7013c8e1f8665bf8a74e68543beb746afae6c",
  "targetAncestry": [
    "Operator runbook — herdr cockpit"
  ],
  "claimKind": "procedure",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/operator-runbook-herdr-cockpit.md#what-each-pane-does to docs/platform/herdr-web-dashboard/operations/operator-runbook.md#what-each-pane-does. Carry the complete unit into its candidate guide / runbook owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/operator-runbook-herdr-cockpit.md#what-each-pane-does`
Source unit SHA256: `e0cca48c30c767de1a557525fce7013c8e1f8665bf8a74e68543beb746afae6c`
Shown source SHA256: `393bb4e0cc6e12842805fcee29265c1171461f951bc58be52ba1790817b484f1`

````text
## What each pane does

1. **fgos-runner-loop** — `node bin/fgos-runner.mjs --once` in a poll-sleep
   shell loop (5s). No new runner flag: `--once` + `runner.lock` are already
   idempotent, so this is a plain wrapper, not new runner behavior.
2. **fgos-tail-log** — `tail -F .fgos/logs/*.log`, live per-item worker
   output as it's produced (STR39).
3. **human-door** — a plain interactive shell. This pane *is* where you type
   the next `fgos` verb (`submit`, `ask`/`answer`, `review`/`approve`/
   `reject`, `catchup`) — intentionally unscripted.
4. **fgos-dashboard** — polls `fgos list --json` every 5s, prints a compact
   status line (counts per status), and fires exactly one native
   `herdr notification show` the first time an item enters `awaiting-human`
   (never again while it stays in that status; fires again if it leaves and
   later re-enters).
````

Target: `docs/platform/herdr-web-dashboard/operations/operator-runbook.md#what-each-pane-does`
Target unit SHA256: `e0cca48c30c767de1a557525fce7013c8e1f8665bf8a74e68543beb746afae6c`
Shown target SHA256: `393bb4e0cc6e12842805fcee29265c1171461f951bc58be52ba1790817b484f1`

````text
## What each pane does

1. **fgos-runner-loop** — `node bin/fgos-runner.mjs --once` in a poll-sleep
   shell loop (5s). No new runner flag: `--once` + `runner.lock` are already
   idempotent, so this is a plain wrapper, not new runner behavior.
2. **fgos-tail-log** — `tail -F .fgos/logs/*.log`, live per-item worker
   output as it's produced (STR39).
3. **human-door** — a plain interactive shell. This pane *is* where you type
   the next `fgos` verb (`submit`, `ask`/`answer`, `review`/`approve`/
   `reject`, `catchup`) — intentionally unscripted.
4. **fgos-dashboard** — polls `fgos list --json` every 5s, prints a compact
   status line (counts per status), and fires exactly one native
   `herdr notification show` the first time an item enters `awaiting-human`
   (never again while it stays in that status; fires again if it leaves and
   later re-enters).
````

````diff

````
## source-decision claim_ae1084adac7d308021b26d13b942e951

Decision:

````json
{
  "claimId": "claim_ae1084adac7d308021b26d13b942e951",
  "sourceUnitDigest": "eb07b198b4c01cc50071d1edbd914f51f2304f73d0216560e0da2be1f60fd17f",
  "targetOwner": "docs/platform/herdr-web-dashboard/operations/operator-runbook.md",
  "targetAnchor": "unheaded-block-8",
  "targetUnitDigest": "eb07b198b4c01cc50071d1edbd914f51f2304f73d0216560e0da2be1f60fd17f",
  "targetAncestry": [
    "Operator runbook — herdr cockpit",
    "What each pane does"
  ],
  "claimKind": "procedure",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/operator-runbook-herdr-cockpit.md#unheaded-block-7 to docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-8. Carry the complete unit into its candidate guide / runbook owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/operator-runbook-herdr-cockpit.md#unheaded-block-7`
Source unit SHA256: `eb07b198b4c01cc50071d1edbd914f51f2304f73d0216560e0da2be1f60fd17f`
Shown source SHA256: `eb07b198b4c01cc50071d1edbd914f51f2304f73d0216560e0da2be1f60fd17f`

````text
1. **fgos-runner-loop** — `node bin/fgos-runner.mjs --once` in a poll-sleep
   shell loop (5s). No new runner flag: `--once` + `runner.lock` are already
   idempotent, so this is a plain wrapper, not new runner behavior.
2. **fgos-tail-log** — `tail -F .fgos/logs/*.log`, live per-item worker
   output as it's produced (STR39).
3. **human-door** — a plain interactive shell. This pane *is* where you type
   the next `fgos` verb (`submit`, `ask`/`answer`, `review`/`approve`/
   `reject`, `catchup`) — intentionally unscripted.
4. **fgos-dashboard** — polls `fgos list --json` every 5s, prints a compact
   status line (counts per status), and fires exactly one native
   `herdr notification show` the first time an item enters `awaiting-human`
   (never again while it stays in that status; fires again if it leaves and
   later re-enters).
````

Target: `docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-8`
Target unit SHA256: `eb07b198b4c01cc50071d1edbd914f51f2304f73d0216560e0da2be1f60fd17f`
Shown target SHA256: `eb07b198b4c01cc50071d1edbd914f51f2304f73d0216560e0da2be1f60fd17f`

````text
1. **fgos-runner-loop** — `node bin/fgos-runner.mjs --once` in a poll-sleep
   shell loop (5s). No new runner flag: `--once` + `runner.lock` are already
   idempotent, so this is a plain wrapper, not new runner behavior.
2. **fgos-tail-log** — `tail -F .fgos/logs/*.log`, live per-item worker
   output as it's produced (STR39).
3. **human-door** — a plain interactive shell. This pane *is* where you type
   the next `fgos` verb (`submit`, `ask`/`answer`, `review`/`approve`/
   `reject`, `catchup`) — intentionally unscripted.
4. **fgos-dashboard** — polls `fgos list --json` every 5s, prints a compact
   status line (counts per status), and fires exactly one native
   `herdr notification show` the first time an item enters `awaiting-human`
   (never again while it stays in that status; fires again if it leaves and
   later re-enters).
````

````diff

````
## source-decision claim_dc15f07c550bf404319d871605060410

Decision:

````json
{
  "claimId": "claim_dc15f07c550bf404319d871605060410",
  "sourceUnitDigest": "a22779729ca512e472fb7ab524ba43386c82914904b72dab32b2607010a0de76",
  "targetOwner": "docs/platform/herdr-web-dashboard/operations/operator-runbook.md",
  "targetAnchor": "hard-rule",
  "targetUnitDigest": "a22779729ca512e472fb7ab524ba43386c82914904b72dab32b2607010a0de76",
  "targetAncestry": [
    "Operator runbook — herdr cockpit"
  ],
  "claimKind": "procedure",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/operator-runbook-herdr-cockpit.md#hard-rule to docs/platform/herdr-web-dashboard/operations/operator-runbook.md#hard-rule. Carry the complete unit into its candidate guide / runbook owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/operator-runbook-herdr-cockpit.md#hard-rule`
Source unit SHA256: `a22779729ca512e472fb7ab524ba43386c82914904b72dab32b2607010a0de76`
Shown source SHA256: `8b67c45b1140a7c96b6dfcaaf99b07ca9464edc6fde1e8e592883f338a46723a`

````text
## Hard rule

**herdr is used ONLY as chrome** — `pane split`/`pane run`/`pane read`/
`tab create`/`notification show`. This cockpit **never** calls
`herdr agent start` and **never** reads herdr's own `agent_status`
(idle/working/blocked/done) as a decision signal. Every real status signal
comes from the fgOS event log, via the fgOS CLI (`fgos list`/`rollup`/
`triage`) — one source of truth.

This is not a style preference: herdr's own agent-detection layer caused a
measured production bug elsewhere ("idle killed an agent", observed in this
project's own dogfooding) precisely because it became a second, competing
source of truth about what was happening. If you're extending this cockpit,
do not reach for `herdr agent ...` commands or any `agent_status` field —
read fgOS's own CLI instead. See decision D d3dbe7f5 for the original reasoning; superseded 2026-09-06 by decision "RUL40 re-scope" (docs/specs/runner.md RUL40): herdr is still never the source of truth, but Dispatch may use herdr's agent API as transport and failure detector.
````

Target: `docs/platform/herdr-web-dashboard/operations/operator-runbook.md#hard-rule`
Target unit SHA256: `a22779729ca512e472fb7ab524ba43386c82914904b72dab32b2607010a0de76`
Shown target SHA256: `8b67c45b1140a7c96b6dfcaaf99b07ca9464edc6fde1e8e592883f338a46723a`

````text
## Hard rule

**herdr is used ONLY as chrome** — `pane split`/`pane run`/`pane read`/
`tab create`/`notification show`. This cockpit **never** calls
`herdr agent start` and **never** reads herdr's own `agent_status`
(idle/working/blocked/done) as a decision signal. Every real status signal
comes from the fgOS event log, via the fgOS CLI (`fgos list`/`rollup`/
`triage`) — one source of truth.

This is not a style preference: herdr's own agent-detection layer caused a
measured production bug elsewhere ("idle killed an agent", observed in this
project's own dogfooding) precisely because it became a second, competing
source of truth about what was happening. If you're extending this cockpit,
do not reach for `herdr agent ...` commands or any `agent_status` field —
read fgOS's own CLI instead. See decision D d3dbe7f5 for the original reasoning; superseded 2026-09-06 by decision "RUL40 re-scope" (docs/specs/runner.md RUL40): herdr is still never the source of truth, but Dispatch may use herdr's agent API as transport and failure detector.
````

````diff

````
## source-decision claim_78bc2da3fd83ef7878d0a7049c1ea120

Decision:

````json
{
  "claimId": "claim_78bc2da3fd83ef7878d0a7049c1ea120",
  "sourceUnitDigest": "df588dc685d48066e0e45d4d7fd6cb05715c66f7763f4be462364d416ffebed2",
  "targetOwner": "docs/platform/herdr-web-dashboard/operations/operator-runbook.md",
  "targetAnchor": "unheaded-block-9",
  "targetUnitDigest": "df588dc685d48066e0e45d4d7fd6cb05715c66f7763f4be462364d416ffebed2",
  "targetAncestry": [
    "Operator runbook — herdr cockpit",
    "Hard rule"
  ],
  "claimKind": "procedure",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/operator-runbook-herdr-cockpit.md#unheaded-block-8 to docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-9. Carry the complete unit into its candidate guide / runbook owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/operator-runbook-herdr-cockpit.md#unheaded-block-8`
Source unit SHA256: `df588dc685d48066e0e45d4d7fd6cb05715c66f7763f4be462364d416ffebed2`
Shown source SHA256: `df588dc685d48066e0e45d4d7fd6cb05715c66f7763f4be462364d416ffebed2`

````text
**herdr is used ONLY as chrome** — `pane split`/`pane run`/`pane read`/
`tab create`/`notification show`. This cockpit **never** calls
`herdr agent start` and **never** reads herdr's own `agent_status`
(idle/working/blocked/done) as a decision signal. Every real status signal
comes from the fgOS event log, via the fgOS CLI (`fgos list`/`rollup`/
`triage`) — one source of truth.
````

Target: `docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-9`
Target unit SHA256: `df588dc685d48066e0e45d4d7fd6cb05715c66f7763f4be462364d416ffebed2`
Shown target SHA256: `df588dc685d48066e0e45d4d7fd6cb05715c66f7763f4be462364d416ffebed2`

````text
**herdr is used ONLY as chrome** — `pane split`/`pane run`/`pane read`/
`tab create`/`notification show`. This cockpit **never** calls
`herdr agent start` and **never** reads herdr's own `agent_status`
(idle/working/blocked/done) as a decision signal. Every real status signal
comes from the fgOS event log, via the fgOS CLI (`fgos list`/`rollup`/
`triage`) — one source of truth.
````

````diff

````
## source-decision claim_012a0e00142cc7d17fdaeb65af97ea39

Decision:

````json
{
  "claimId": "claim_012a0e00142cc7d17fdaeb65af97ea39",
  "sourceUnitDigest": "252e9a74d8d47746c674fdd11cc3073b977cadc33abbf028d7128b55a1e29e86",
  "targetOwner": "docs/platform/herdr-web-dashboard/operations/operator-runbook.md",
  "targetAnchor": "unheaded-block-10",
  "targetUnitDigest": "252e9a74d8d47746c674fdd11cc3073b977cadc33abbf028d7128b55a1e29e86",
  "targetAncestry": [
    "Operator runbook — herdr cockpit",
    "Hard rule"
  ],
  "claimKind": "procedure",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/operator-runbook-herdr-cockpit.md#unheaded-block-9 to docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-10. Carry the complete unit into its candidate guide / runbook owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/operator-runbook-herdr-cockpit.md#unheaded-block-9`
Source unit SHA256: `252e9a74d8d47746c674fdd11cc3073b977cadc33abbf028d7128b55a1e29e86`
Shown source SHA256: `252e9a74d8d47746c674fdd11cc3073b977cadc33abbf028d7128b55a1e29e86`

````text
This is not a style preference: herdr's own agent-detection layer caused a
measured production bug elsewhere ("idle killed an agent", observed in this
project's own dogfooding) precisely because it became a second, competing
source of truth about what was happening. If you're extending this cockpit,
do not reach for `herdr agent ...` commands or any `agent_status` field —
read fgOS's own CLI instead. See decision D d3dbe7f5 for the original reasoning; superseded 2026-09-06 by decision "RUL40 re-scope" (docs/specs/runner.md RUL40): herdr is still never the source of truth, but Dispatch may use herdr's agent API as transport and failure detector.
````

Target: `docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-10`
Target unit SHA256: `252e9a74d8d47746c674fdd11cc3073b977cadc33abbf028d7128b55a1e29e86`
Shown target SHA256: `252e9a74d8d47746c674fdd11cc3073b977cadc33abbf028d7128b55a1e29e86`

````text
This is not a style preference: herdr's own agent-detection layer caused a
measured production bug elsewhere ("idle killed an agent", observed in this
project's own dogfooding) precisely because it became a second, competing
source of truth about what was happening. If you're extending this cockpit,
do not reach for `herdr agent ...` commands or any `agent_status` field —
read fgOS's own CLI instead. See decision D d3dbe7f5 for the original reasoning; superseded 2026-09-06 by decision "RUL40 re-scope" (docs/specs/runner.md RUL40): herdr is still never the source of truth, but Dispatch may use herdr's agent API as transport and failure detector.
````

````diff

````
## source-decision claim_ec7b9a652a6e915d3543e2b4d89571c8

Decision:

````json
{
  "claimId": "claim_ec7b9a652a6e915d3543e2b4d89571c8",
  "sourceUnitDigest": "1f668227d2c0fee889ceca2b962ca77213072b9d9dbcb6ad35e9217289186da0",
  "targetOwner": "docs/platform/herdr-web-dashboard/operations/operator-runbook.md",
  "targetAnchor": "multi-operator-use",
  "targetUnitDigest": "1f668227d2c0fee889ceca2b962ca77213072b9d9dbcb6ad35e9217289186da0",
  "targetAncestry": [
    "Operator runbook — herdr cockpit"
  ],
  "claimKind": "procedure",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/operator-runbook-herdr-cockpit.md#multi-operator-use to docs/platform/herdr-web-dashboard/operations/operator-runbook.md#multi-operator-use. Carry the complete unit into its candidate guide / runbook owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/operator-runbook-herdr-cockpit.md#multi-operator-use`
Source unit SHA256: `1f668227d2c0fee889ceca2b962ca77213072b9d9dbcb6ad35e9217289186da0`
Shown source SHA256: `4c8a6d402ce5c9d090a317b0bef3d4a2963d11221f4f58bbf8ec4c048c53567a`

````text
## Multi-operator use

If a second operator attaches to the same herdr session, herdr's own
protocol negotiates ownership (`herdr terminal attach <id> --takeover`) —
this is existing herdr behavior, not something this feature builds. The
first attached client keeps write access unless a later client explicitly
takes over; anyone else can still read.
````

Target: `docs/platform/herdr-web-dashboard/operations/operator-runbook.md#multi-operator-use`
Target unit SHA256: `1f668227d2c0fee889ceca2b962ca77213072b9d9dbcb6ad35e9217289186da0`
Shown target SHA256: `4c8a6d402ce5c9d090a317b0bef3d4a2963d11221f4f58bbf8ec4c048c53567a`

````text
## Multi-operator use

If a second operator attaches to the same herdr session, herdr's own
protocol negotiates ownership (`herdr terminal attach <id> --takeover`) —
this is existing herdr behavior, not something this feature builds. The
first attached client keeps write access unless a later client explicitly
takes over; anyone else can still read.
````

````diff

````
## source-decision claim_0d1b7c0c9b9ab622449a0600b45a0eb7

Decision:

````json
{
  "claimId": "claim_0d1b7c0c9b9ab622449a0600b45a0eb7",
  "sourceUnitDigest": "aaca4fa176c972e45193fcaf5d099da837444d6dd5f57bdbedf5df42c6480d52",
  "targetOwner": "docs/platform/herdr-web-dashboard/operations/operator-runbook.md",
  "targetAnchor": "unheaded-block-11",
  "targetUnitDigest": "aaca4fa176c972e45193fcaf5d099da837444d6dd5f57bdbedf5df42c6480d52",
  "targetAncestry": [
    "Operator runbook — herdr cockpit",
    "Multi-operator use"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/operator-runbook-herdr-cockpit.md#unheaded-block-10 to docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-11. Carry the complete unit into its candidate guide / runbook owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/operator-runbook-herdr-cockpit.md#unheaded-block-10`
Source unit SHA256: `aaca4fa176c972e45193fcaf5d099da837444d6dd5f57bdbedf5df42c6480d52`
Shown source SHA256: `aaca4fa176c972e45193fcaf5d099da837444d6dd5f57bdbedf5df42c6480d52`

````text
If a second operator attaches to the same herdr session, herdr's own
protocol negotiates ownership (`herdr terminal attach <id> --takeover`) —
this is existing herdr behavior, not something this feature builds. The
first attached client keeps write access unless a later client explicitly
takes over; anyone else can still read.
````

Target: `docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-11`
Target unit SHA256: `aaca4fa176c972e45193fcaf5d099da837444d6dd5f57bdbedf5df42c6480d52`
Shown target SHA256: `aaca4fa176c972e45193fcaf5d099da837444d6dd5f57bdbedf5df42c6480d52`

````text
If a second operator attaches to the same herdr session, herdr's own
protocol negotiates ownership (`herdr terminal attach <id> --takeover`) —
this is existing herdr behavior, not something this feature builds. The
first attached client keeps write access unless a later client explicitly
takes over; anyone else can still read.
````

````diff

````
## source-decision claim_f871a08707dbed487f7fa553c89717d6

Decision:

````json
{
  "claimId": "claim_f871a08707dbed487f7fa553c89717d6",
  "sourceUnitDigest": "280d43e801ced7aeb5104959f8452af1aae5f2ca90c5b37c698edbcfcecbee8e",
  "targetOwner": "docs/platform/herdr-web-dashboard/operations/operator-runbook.md",
  "targetAnchor": "concurrent-merge-safety",
  "targetUnitDigest": "280d43e801ced7aeb5104959f8452af1aae5f2ca90c5b37c698edbcfcecbee8e",
  "targetAncestry": [
    "Operator runbook — herdr cockpit"
  ],
  "claimKind": "procedure",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/operator-runbook-herdr-cockpit.md#concurrent-merge-safety to docs/platform/herdr-web-dashboard/operations/operator-runbook.md#concurrent-merge-safety. Carry the complete unit into its candidate guide / runbook owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/operator-runbook-herdr-cockpit.md#concurrent-merge-safety`
Source unit SHA256: `280d43e801ced7aeb5104959f8452af1aae5f2ca90c5b37c698edbcfcecbee8e`
Shown source SHA256: `b88a7bda7936d118753af0661813cf7784c625170d63a0852f46ab3f82f8a478`

````text
## Concurrent-merge safety

This cockpit adds no new code on the merge/approve path. `approve` already
does not false-alarm when the runner merges in parallel — that guarantee was
fixed by STR35 (`fgos-multi-session-checkout`) and this cockpit only exposes it
through the dashboard pane, it does not re-implement it.
````

Target: `docs/platform/herdr-web-dashboard/operations/operator-runbook.md#concurrent-merge-safety`
Target unit SHA256: `280d43e801ced7aeb5104959f8452af1aae5f2ca90c5b37c698edbcfcecbee8e`
Shown target SHA256: `b88a7bda7936d118753af0661813cf7784c625170d63a0852f46ab3f82f8a478`

````text
## Concurrent-merge safety

This cockpit adds no new code on the merge/approve path. `approve` already
does not false-alarm when the runner merges in parallel — that guarantee was
fixed by STR35 (`fgos-multi-session-checkout`) and this cockpit only exposes it
through the dashboard pane, it does not re-implement it.
````

````diff

````
## source-decision claim_fdc876d40609ff4ba08a598298b20d08

Decision:

````json
{
  "claimId": "claim_fdc876d40609ff4ba08a598298b20d08",
  "sourceUnitDigest": "fe7b96412a8bbe310e18527da7e60892ffa4f0cd47a9fdf14d4b520b4d6f96a2",
  "targetOwner": "docs/platform/herdr-web-dashboard/operations/operator-runbook.md",
  "targetAnchor": "unheaded-block-12",
  "targetUnitDigest": "fe7b96412a8bbe310e18527da7e60892ffa4f0cd47a9fdf14d4b520b4d6f96a2",
  "targetAncestry": [
    "Operator runbook — herdr cockpit",
    "Concurrent-merge safety"
  ],
  "claimKind": "procedure",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/operator-runbook-herdr-cockpit.md#unheaded-block-11 to docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-12. Carry the complete unit into its candidate guide / runbook owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/operator-runbook-herdr-cockpit.md#unheaded-block-11`
Source unit SHA256: `fe7b96412a8bbe310e18527da7e60892ffa4f0cd47a9fdf14d4b520b4d6f96a2`
Shown source SHA256: `fe7b96412a8bbe310e18527da7e60892ffa4f0cd47a9fdf14d4b520b4d6f96a2`

````text
This cockpit adds no new code on the merge/approve path. `approve` already
does not false-alarm when the runner merges in parallel — that guarantee was
fixed by STR35 (`fgos-multi-session-checkout`) and this cockpit only exposes it
through the dashboard pane, it does not re-implement it.
````

Target: `docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-12`
Target unit SHA256: `fe7b96412a8bbe310e18527da7e60892ffa4f0cd47a9fdf14d4b520b4d6f96a2`
Shown target SHA256: `fe7b96412a8bbe310e18527da7e60892ffa4f0cd47a9fdf14d4b520b4d6f96a2`

````text
This cockpit adds no new code on the merge/approve path. `approve` already
does not false-alarm when the runner merges in parallel — that guarantee was
fixed by STR35 (`fgos-multi-session-checkout`) and this cockpit only exposes it
through the dashboard pane, it does not re-implement it.
````

````diff

````
## source-decision claim_569ce419bdaa3e1d7fad4f2da1e652b2

Decision:

````json
{
  "claimId": "claim_569ce419bdaa3e1d7fad4f2da1e652b2",
  "sourceUnitDigest": "8f61f45a3a22860498899b29f2bf0eeb07569c9a31ad502bf91292748ba8411a",
  "targetOwner": "docs/platform/runner/contracts/routing-handoff.md",
  "targetAnchor": "routing-handoff-contract-fgos-runner",
  "targetUnitDigest": "8a4633a098112bd85e3e30b3926de510983a1a6b5470193e311d1b0dea3b4348",
  "targetAncestry": [],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/routing-handoff-contract.md#routing-handoff-contract-fgos-runner to docs/platform/runner/contracts/routing-handoff.md#routing-handoff-contract-fgos-runner. Carry the complete unit into its candidate contract owner. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/routing-handoff-contract.md#routing-handoff-contract-fgos-runner`
Source unit SHA256: `8f61f45a3a22860498899b29f2bf0eeb07569c9a31ad502bf91292748ba8411a`
Shown source SHA256: `c5d33d7851eab9da7703115d4aad5133ecad752275351b78836ab403e3b80d91`

````text
# Routing Handoff Contract — fgos-runner

Contract chuyển việc **agent ↔ agent trong chain** cho vòng lặp runner (Phase
2, epic E3). Theo luật routing-theo-audience (`docs/platform-foundations.md`
L4, D-ID `14ebeea9`): agent↔agent trong chain dùng **prose-handoff tường
minh**, không JSON contract — LLM đọc prose tốt hơn parse JSON. Tài liệu này
là bản chốt bằng văn xuôi của contract đó cho runner cụ thể; không phải code
runtime mới (chỉ prose + bảng).
````

Target: `docs/platform/runner/contracts/routing-handoff.md#routing-handoff-contract-fgos-runner`
Target unit SHA256: `8a4633a098112bd85e3e30b3926de510983a1a6b5470193e311d1b0dea3b4348`
Shown target SHA256: `56b7dad9c68703ee773a11a8c59351c72eca0aabb43fb18ec751a4afd615fb03`

````text
# Routing Handoff Contract — fgos-runner

```txt
Document type: Contract
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve the mapped source as candidate material for conservation review
Design status: Candidate
Implementation: Historical source retained; current truth not certified
Provenance: docs/routing-handoff-contract.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing conservation of the mapped legacy source
Do not use this for: Current canonical authority or proof of implemented behavior
Last reviewed: 2026-10-14
Related:
- docs/routing-handoff-contract.md
Supersedes: None; candidate only
Superseded by: None
```

Contract chuyển việc **agent ↔ agent trong chain** cho vòng lặp runner (Phase
2, epic E3). Theo luật routing-theo-audience (`docs/platform-foundations.md`
L4, D-ID `14ebeea9`): agent↔agent trong chain dùng **prose-handoff tường
minh**, không JSON contract — LLM đọc prose tốt hơn parse JSON. Tài liệu này
là bản chốt bằng văn xuôi của contract đó cho runner cụ thể; không phải code
runtime mới (chỉ prose + bảng).
````

````diff
--- docs/routing-handoff-contract.md
+++ docs/platform/runner/contracts/routing-handoff.md
@@ -1,0 +2,19 @@
+
+```txt
+Document type: Contract
+Audience: Documentation migration reviewer, maintainer, agent
+Purpose: Preserve the mapped source as candidate material for conservation review
+Design status: Candidate
+Implementation: Historical source retained; current truth not certified
+Provenance: docs/routing-handoff-contract.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
+Writer type: Agent draft writer
+Canonical: No
+Canonical for: None; candidate only
+Use this when: Reviewing conservation of the mapped legacy source
+Do not use this for: Current canonical authority or proof of implemented behavior
+Last reviewed: 2026-10-14
+Related:
+- docs/routing-handoff-contract.md
+Supersedes: None; candidate only
+Superseded by: None
+```
````
## source-decision claim_54a6e4fa2bb7d2bd540ad9b2a63268d9

Decision:

````json
{
  "claimId": "claim_54a6e4fa2bb7d2bd540ad9b2a63268d9",
  "sourceUnitDigest": "509c09f8d9c5d789b48446cbc179231de7fa268133ade3900676a574f08732b9",
  "targetOwner": "docs/platform/runner/contracts/routing-handoff.md",
  "targetAnchor": "unheaded-block-2",
  "targetUnitDigest": "509c09f8d9c5d789b48446cbc179231de7fa268133ade3900676a574f08732b9",
  "targetAncestry": [
    "Routing Handoff Contract — fgos-runner"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/routing-handoff-contract.md#unheaded-block-1 to docs/platform/runner/contracts/routing-handoff.md#unheaded-block-2. Carry the complete unit into its candidate contract owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/routing-handoff-contract.md#unheaded-block-1`
Source unit SHA256: `509c09f8d9c5d789b48446cbc179231de7fa268133ade3900676a574f08732b9`
Shown source SHA256: `509c09f8d9c5d789b48446cbc179231de7fa268133ade3900676a574f08732b9`

````text
Contract chuyển việc **agent ↔ agent trong chain** cho vòng lặp runner (Phase
2, epic E3). Theo luật routing-theo-audience (`docs/platform-foundations.md`
L4, D-ID `14ebeea9`): agent↔agent trong chain dùng **prose-handoff tường
minh**, không JSON contract — LLM đọc prose tốt hơn parse JSON. Tài liệu này
là bản chốt bằng văn xuôi của contract đó cho runner cụ thể; không phải code
runtime mới (chỉ prose + bảng).
````

Target: `docs/platform/runner/contracts/routing-handoff.md#unheaded-block-2`
Target unit SHA256: `509c09f8d9c5d789b48446cbc179231de7fa268133ade3900676a574f08732b9`
Shown target SHA256: `509c09f8d9c5d789b48446cbc179231de7fa268133ade3900676a574f08732b9`

````text
Contract chuyển việc **agent ↔ agent trong chain** cho vòng lặp runner (Phase
2, epic E3). Theo luật routing-theo-audience (`docs/platform-foundations.md`
L4, D-ID `14ebeea9`): agent↔agent trong chain dùng **prose-handoff tường
minh**, không JSON contract — LLM đọc prose tốt hơn parse JSON. Tài liệu này
là bản chốt bằng văn xuôi của contract đó cho runner cụ thể; không phải code
runtime mới (chỉ prose + bảng).
````

````diff

````
## source-decision claim_194eabab7aeaa3830c79a7a855148034

Decision:

````json
{
  "claimId": "claim_194eabab7aeaa3830c79a7a855148034",
  "sourceUnitDigest": "01d501eb1f1ae75195d040a9c33e8682c418f2c05d344067525f67dd74521e67",
  "targetOwner": "docs/platform/runner/contracts/routing-handoff.md",
  "targetAnchor": "khung-prompt-4-phần",
  "targetUnitDigest": "01d501eb1f1ae75195d040a9c33e8682c418f2c05d344067525f67dd74521e67",
  "targetAncestry": [
    "Routing Handoff Contract — fgos-runner"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/routing-handoff-contract.md#khung-prompt-4-phần to docs/platform/runner/contracts/routing-handoff.md#khung-prompt-4-phần. Carry the complete unit into its candidate contract owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/routing-handoff-contract.md#khung-prompt-4-phần`
Source unit SHA256: `01d501eb1f1ae75195d040a9c33e8682c418f2c05d344067525f67dd74521e67`
Shown source SHA256: `307457a8ae0ee5b1aef474724e545ada1179b2f42a4a2a8c494773c3b182dd38`

````text
## Khung prompt 4 phần

Mỗi lần dispatch, runner dựng prompt cho worker từ đúng bốn phần cố định
(nguồn: `src/runner/dispatch.mjs`'s `buildPrompt`, per D3) — thứ tự và tiêu
đề là contract, test đã pin sự hiện diện của cả bốn:

1. **Goal** — tiêu đề + kind của work item, lấy nguyên từ item, không diễn
   giải thêm.
2. **Worktree boundary** — worker chạy trên một worktree/nhánh cô lập riêng
   cho đúng item này (per D4); ở lại trong checkout đó, không chạm working
   tree chính, nhánh khác, hay worktree khác.
3. **Expected proof** — câu lệnh `verify` của chính item, nói rõ: runner tự
   chạy lại câu lệnh này sau khi worker xong (goal-check, per D3) — báo cáo
   của worker không bao giờ được tin một mình.
4. **Constraints** — cấm gọi `fgos` hoặc ghi `.fgos/` trực tiếp (runner là
   người ghi duy nhất trong vòng dispatch, per D3); commit trên nhánh của
   mình và báo cáo; không merge/push/tự duyệt việc của mình.
````

Target: `docs/platform/runner/contracts/routing-handoff.md#khung-prompt-4-phần`
Target unit SHA256: `01d501eb1f1ae75195d040a9c33e8682c418f2c05d344067525f67dd74521e67`
Shown target SHA256: `307457a8ae0ee5b1aef474724e545ada1179b2f42a4a2a8c494773c3b182dd38`

````text
## Khung prompt 4 phần

Mỗi lần dispatch, runner dựng prompt cho worker từ đúng bốn phần cố định
(nguồn: `src/runner/dispatch.mjs`'s `buildPrompt`, per D3) — thứ tự và tiêu
đề là contract, test đã pin sự hiện diện của cả bốn:

1. **Goal** — tiêu đề + kind của work item, lấy nguyên từ item, không diễn
   giải thêm.
2. **Worktree boundary** — worker chạy trên một worktree/nhánh cô lập riêng
   cho đúng item này (per D4); ở lại trong checkout đó, không chạm working
   tree chính, nhánh khác, hay worktree khác.
3. **Expected proof** — câu lệnh `verify` của chính item, nói rõ: runner tự
   chạy lại câu lệnh này sau khi worker xong (goal-check, per D3) — báo cáo
   của worker không bao giờ được tin một mình.
4. **Constraints** — cấm gọi `fgos` hoặc ghi `.fgos/` trực tiếp (runner là
   người ghi duy nhất trong vòng dispatch, per D3); commit trên nhánh của
   mình và báo cáo; không merge/push/tự duyệt việc của mình.
````

````diff

````
## source-decision claim_a2a657b63256927bfdad8cc99cd978f8

Decision:

````json
{
  "claimId": "claim_a2a657b63256927bfdad8cc99cd978f8",
  "sourceUnitDigest": "8b5e7c62b0389dfd419b8d3e3e2c0e14badeaeb32f1af3abaa200bfc5019b1a4",
  "targetOwner": "docs/platform/runner/contracts/routing-handoff.md",
  "targetAnchor": "unheaded-block-3",
  "targetUnitDigest": "8b5e7c62b0389dfd419b8d3e3e2c0e14badeaeb32f1af3abaa200bfc5019b1a4",
  "targetAncestry": [
    "Routing Handoff Contract — fgos-runner",
    "Khung prompt 4 phần"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/routing-handoff-contract.md#unheaded-block-2 to docs/platform/runner/contracts/routing-handoff.md#unheaded-block-3. Carry the complete unit into its candidate contract owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/routing-handoff-contract.md#unheaded-block-2`
Source unit SHA256: `8b5e7c62b0389dfd419b8d3e3e2c0e14badeaeb32f1af3abaa200bfc5019b1a4`
Shown source SHA256: `8b5e7c62b0389dfd419b8d3e3e2c0e14badeaeb32f1af3abaa200bfc5019b1a4`

````text
Mỗi lần dispatch, runner dựng prompt cho worker từ đúng bốn phần cố định
(nguồn: `src/runner/dispatch.mjs`'s `buildPrompt`, per D3) — thứ tự và tiêu
đề là contract, test đã pin sự hiện diện của cả bốn:
````

Target: `docs/platform/runner/contracts/routing-handoff.md#unheaded-block-3`
Target unit SHA256: `8b5e7c62b0389dfd419b8d3e3e2c0e14badeaeb32f1af3abaa200bfc5019b1a4`
Shown target SHA256: `8b5e7c62b0389dfd419b8d3e3e2c0e14badeaeb32f1af3abaa200bfc5019b1a4`

````text
Mỗi lần dispatch, runner dựng prompt cho worker từ đúng bốn phần cố định
(nguồn: `src/runner/dispatch.mjs`'s `buildPrompt`, per D3) — thứ tự và tiêu
đề là contract, test đã pin sự hiện diện của cả bốn:
````

````diff

````
## source-decision claim_70e8e2edaa40f70f6739adb0f53818b4

Decision:

````json
{
  "claimId": "claim_70e8e2edaa40f70f6739adb0f53818b4",
  "sourceUnitDigest": "3bad6f8df905ee9bbfa79324205fbc11cd21b56a1c356970c1edffc66da6e9e9",
  "targetOwner": "docs/platform/runner/contracts/routing-handoff.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "3bad6f8df905ee9bbfa79324205fbc11cd21b56a1c356970c1edffc66da6e9e9",
  "targetAncestry": [
    "Routing Handoff Contract — fgos-runner",
    "Khung prompt 4 phần"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/routing-handoff-contract.md#unheaded-block-3 to docs/platform/runner/contracts/routing-handoff.md#unheaded-block-4. Carry the complete unit into its candidate contract owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/routing-handoff-contract.md#unheaded-block-3`
Source unit SHA256: `3bad6f8df905ee9bbfa79324205fbc11cd21b56a1c356970c1edffc66da6e9e9`
Shown source SHA256: `3bad6f8df905ee9bbfa79324205fbc11cd21b56a1c356970c1edffc66da6e9e9`

````text
1. **Goal** — tiêu đề + kind của work item, lấy nguyên từ item, không diễn
   giải thêm.
2. **Worktree boundary** — worker chạy trên một worktree/nhánh cô lập riêng
   cho đúng item này (per D4); ở lại trong checkout đó, không chạm working
   tree chính, nhánh khác, hay worktree khác.
3. **Expected proof** — câu lệnh `verify` của chính item, nói rõ: runner tự
   chạy lại câu lệnh này sau khi worker xong (goal-check, per D3) — báo cáo
   của worker không bao giờ được tin một mình.
4. **Constraints** — cấm gọi `fgos` hoặc ghi `.fgos/` trực tiếp (runner là
   người ghi duy nhất trong vòng dispatch, per D3); commit trên nhánh của
   mình và báo cáo; không merge/push/tự duyệt việc của mình.
````

Target: `docs/platform/runner/contracts/routing-handoff.md#unheaded-block-4`
Target unit SHA256: `3bad6f8df905ee9bbfa79324205fbc11cd21b56a1c356970c1edffc66da6e9e9`
Shown target SHA256: `3bad6f8df905ee9bbfa79324205fbc11cd21b56a1c356970c1edffc66da6e9e9`

````text
1. **Goal** — tiêu đề + kind của work item, lấy nguyên từ item, không diễn
   giải thêm.
2. **Worktree boundary** — worker chạy trên một worktree/nhánh cô lập riêng
   cho đúng item này (per D4); ở lại trong checkout đó, không chạm working
   tree chính, nhánh khác, hay worktree khác.
3. **Expected proof** — câu lệnh `verify` của chính item, nói rõ: runner tự
   chạy lại câu lệnh này sau khi worker xong (goal-check, per D3) — báo cáo
   của worker không bao giờ được tin một mình.
4. **Constraints** — cấm gọi `fgos` hoặc ghi `.fgos/` trực tiếp (runner là
   người ghi duy nhất trong vòng dispatch, per D3); commit trên nhánh của
   mình và báo cáo; không merge/push/tự duyệt việc của mình.
````

````diff

````
## source-decision claim_565cb70d72f4b1a506c52e85bbb082b6

Decision:

````json
{
  "claimId": "claim_565cb70d72f4b1a506c52e85bbb082b6",
  "sourceUnitDigest": "6aee4cda6fa5543ab0d85ea338daa2d784e1f0d1736606c4531bbc1425a8ece1",
  "targetOwner": "docs/platform/runner/contracts/routing-handoff.md",
  "targetAnchor": "bảng-entry-router",
  "targetUnitDigest": "6aee4cda6fa5543ab0d85ea338daa2d784e1f0d1736606c4531bbc1425a8ece1",
  "targetAncestry": [
    "Routing Handoff Contract — fgos-runner"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/routing-handoff-contract.md#bảng-entry-router to docs/platform/runner/contracts/routing-handoff.md#bảng-entry-router. Carry the complete unit into its candidate contract owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/routing-handoff-contract.md#bảng-entry-router`
Source unit SHA256: `6aee4cda6fa5543ab0d85ea338daa2d784e1f0d1736606c4531bbc1425a8ece1`
Shown source SHA256: `13253bc679d6076817a85970b89f894ed92de155318cdc511ecb22d59ccab99d`

````text
## Bảng entry-router

Route theo audience (L4): skill/agent forgent tương lai muốn tham gia chain
runner đọc bảng này để biết vào từ đâu — không có một điểm vào toàn cục.

| Vai trò tương lai | Đọc gì trước | Vào ở đâu | Không được làm |
|---|---|---|---|
| Skill khởi tạo backlog (đề xuất work item mới) | `docs/specs/work-state.md` (schema work) | `fgos add` — CLI, một cửa ghi | Không tự ghi `.fgos/events.jsonl` |
| Skill giám sát vòng runner (dashboard/report) | `fgos list` / `fgos ready` (đọc, không ghi, per request-class D1) | Đọc `state.json` hoặc gọi `ready` | Không suy luận frontier bằng danh sách tay — luôn derive (RUL5 (platform-foundations)) |
| Skill duyệt đề xuất (review `proposed` → `done`) | Nhánh `fgw/<id>` + báo cáo worker | `fgos move <id> --to done --expect proposed` | Không tự động merge khi review chưa chạy (per D4 — người/vòng review quyết) |
| Worker kế tiếp trong chain con (agent nối tiếp) | Chính work item đã dispatch (title/kind/refs/verify) | Nhận đúng bốn phần prompt ở trên, không phần nào khác | Không tự gọi `fgos`; không giả định trạng thái ngoài những gì prompt nói |
| Executor mới (đổi agent CLI, ví dụ `codex exec`) | `.fgos/config.json`'s `runner` section — `executor.command`/`args`, template `{prompt}`/`{model}` | Sửa config, không sửa `dispatch.mjs` | Không nối chuỗi prompt vào một lệnh shell (luôn argv, `shell: false`) |
````

Target: `docs/platform/runner/contracts/routing-handoff.md#bảng-entry-router`
Target unit SHA256: `6aee4cda6fa5543ab0d85ea338daa2d784e1f0d1736606c4531bbc1425a8ece1`
Shown target SHA256: `13253bc679d6076817a85970b89f894ed92de155318cdc511ecb22d59ccab99d`

````text
## Bảng entry-router

Route theo audience (L4): skill/agent forgent tương lai muốn tham gia chain
runner đọc bảng này để biết vào từ đâu — không có một điểm vào toàn cục.

| Vai trò tương lai | Đọc gì trước | Vào ở đâu | Không được làm |
|---|---|---|---|
| Skill khởi tạo backlog (đề xuất work item mới) | `docs/specs/work-state.md` (schema work) | `fgos add` — CLI, một cửa ghi | Không tự ghi `.fgos/events.jsonl` |
| Skill giám sát vòng runner (dashboard/report) | `fgos list` / `fgos ready` (đọc, không ghi, per request-class D1) | Đọc `state.json` hoặc gọi `ready` | Không suy luận frontier bằng danh sách tay — luôn derive (RUL5 (platform-foundations)) |
| Skill duyệt đề xuất (review `proposed` → `done`) | Nhánh `fgw/<id>` + báo cáo worker | `fgos move <id> --to done --expect proposed` | Không tự động merge khi review chưa chạy (per D4 — người/vòng review quyết) |
| Worker kế tiếp trong chain con (agent nối tiếp) | Chính work item đã dispatch (title/kind/refs/verify) | Nhận đúng bốn phần prompt ở trên, không phần nào khác | Không tự gọi `fgos`; không giả định trạng thái ngoài những gì prompt nói |
| Executor mới (đổi agent CLI, ví dụ `codex exec`) | `.fgos/config.json`'s `runner` section — `executor.command`/`args`, template `{prompt}`/`{model}` | Sửa config, không sửa `dispatch.mjs` | Không nối chuỗi prompt vào một lệnh shell (luôn argv, `shell: false`) |
````

````diff

````
## source-decision claim_91bdab441dd65393e6ec33bb51149b69

Decision:

````json
{
  "claimId": "claim_91bdab441dd65393e6ec33bb51149b69",
  "sourceUnitDigest": "c2073ac3afb840a1f4cb863f52b45bf5cd07e78d59648c98514d7ce35f0d3851",
  "targetOwner": "docs/platform/runner/contracts/routing-handoff.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "c2073ac3afb840a1f4cb863f52b45bf5cd07e78d59648c98514d7ce35f0d3851",
  "targetAncestry": [
    "Routing Handoff Contract — fgos-runner",
    "Bảng entry-router"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/routing-handoff-contract.md#unheaded-block-4 to docs/platform/runner/contracts/routing-handoff.md#unheaded-block-5. Carry the complete unit into its candidate contract owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/routing-handoff-contract.md#unheaded-block-4`
Source unit SHA256: `c2073ac3afb840a1f4cb863f52b45bf5cd07e78d59648c98514d7ce35f0d3851`
Shown source SHA256: `c2073ac3afb840a1f4cb863f52b45bf5cd07e78d59648c98514d7ce35f0d3851`

````text
Route theo audience (L4): skill/agent forgent tương lai muốn tham gia chain
runner đọc bảng này để biết vào từ đâu — không có một điểm vào toàn cục.
````

Target: `docs/platform/runner/contracts/routing-handoff.md#unheaded-block-5`
Target unit SHA256: `c2073ac3afb840a1f4cb863f52b45bf5cd07e78d59648c98514d7ce35f0d3851`
Shown target SHA256: `c2073ac3afb840a1f4cb863f52b45bf5cd07e78d59648c98514d7ce35f0d3851`

````text
Route theo audience (L4): skill/agent forgent tương lai muốn tham gia chain
runner đọc bảng này để biết vào từ đâu — không có một điểm vào toàn cục.
````

````diff

````
## source-decision claim_1a0339906977f5573af4545866d9e43b

Decision:

````json
{
  "claimId": "claim_1a0339906977f5573af4545866d9e43b",
  "sourceUnitDigest": "55329ade338d4cc7a7821d3882f0a03a86507a60c965554267a1c548a7fa5aa6",
  "targetOwner": "docs/platform/runner/contracts/routing-handoff.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "55329ade338d4cc7a7821d3882f0a03a86507a60c965554267a1c548a7fa5aa6",
  "targetAncestry": [
    "Routing Handoff Contract — fgos-runner",
    "Bảng entry-router"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/routing-handoff-contract.md#unheaded-block-5 to docs/platform/runner/contracts/routing-handoff.md#unheaded-block-6. Carry the complete unit into its candidate contract owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/routing-handoff-contract.md#unheaded-block-5`
Source unit SHA256: `55329ade338d4cc7a7821d3882f0a03a86507a60c965554267a1c548a7fa5aa6`
Shown source SHA256: `55329ade338d4cc7a7821d3882f0a03a86507a60c965554267a1c548a7fa5aa6`

````text
| Vai trò tương lai | Đọc gì trước | Vào ở đâu | Không được làm |
|---|---|---|---|
| Skill khởi tạo backlog (đề xuất work item mới) | `docs/specs/work-state.md` (schema work) | `fgos add` — CLI, một cửa ghi | Không tự ghi `.fgos/events.jsonl` |
| Skill giám sát vòng runner (dashboard/report) | `fgos list` / `fgos ready` (đọc, không ghi, per request-class D1) | Đọc `state.json` hoặc gọi `ready` | Không suy luận frontier bằng danh sách tay — luôn derive (RUL5 (platform-foundations)) |
| Skill duyệt đề xuất (review `proposed` → `done`) | Nhánh `fgw/<id>` + báo cáo worker | `fgos move <id> --to done --expect proposed` | Không tự động merge khi review chưa chạy (per D4 — người/vòng review quyết) |
| Worker kế tiếp trong chain con (agent nối tiếp) | Chính work item đã dispatch (title/kind/refs/verify) | Nhận đúng bốn phần prompt ở trên, không phần nào khác | Không tự gọi `fgos`; không giả định trạng thái ngoài những gì prompt nói |
| Executor mới (đổi agent CLI, ví dụ `codex exec`) | `.fgos/config.json`'s `runner` section — `executor.command`/`args`, template `{prompt}`/`{model}` | Sửa config, không sửa `dispatch.mjs` | Không nối chuỗi prompt vào một lệnh shell (luôn argv, `shell: false`) |
````

Target: `docs/platform/runner/contracts/routing-handoff.md#unheaded-block-6`
Target unit SHA256: `55329ade338d4cc7a7821d3882f0a03a86507a60c965554267a1c548a7fa5aa6`
Shown target SHA256: `55329ade338d4cc7a7821d3882f0a03a86507a60c965554267a1c548a7fa5aa6`

````text
| Vai trò tương lai | Đọc gì trước | Vào ở đâu | Không được làm |
|---|---|---|---|
| Skill khởi tạo backlog (đề xuất work item mới) | `docs/specs/work-state.md` (schema work) | `fgos add` — CLI, một cửa ghi | Không tự ghi `.fgos/events.jsonl` |
| Skill giám sát vòng runner (dashboard/report) | `fgos list` / `fgos ready` (đọc, không ghi, per request-class D1) | Đọc `state.json` hoặc gọi `ready` | Không suy luận frontier bằng danh sách tay — luôn derive (RUL5 (platform-foundations)) |
| Skill duyệt đề xuất (review `proposed` → `done`) | Nhánh `fgw/<id>` + báo cáo worker | `fgos move <id> --to done --expect proposed` | Không tự động merge khi review chưa chạy (per D4 — người/vòng review quyết) |
| Worker kế tiếp trong chain con (agent nối tiếp) | Chính work item đã dispatch (title/kind/refs/verify) | Nhận đúng bốn phần prompt ở trên, không phần nào khác | Không tự gọi `fgos`; không giả định trạng thái ngoài những gì prompt nói |
| Executor mới (đổi agent CLI, ví dụ `codex exec`) | `.fgos/config.json`'s `runner` section — `executor.command`/`args`, template `{prompt}`/`{model}` | Sửa config, không sửa `dispatch.mjs` | Không nối chuỗi prompt vào một lệnh shell (luôn argv, `shell: false`) |
````

````diff

````
## source-decision claim_36c6bf192f3f9afb7278a1dc35dcf5cc

Decision:

````json
{
  "claimId": "claim_36c6bf192f3f9afb7278a1dc35dcf5cc",
  "sourceUnitDigest": "236a8445d1599c3c1542451ef41fe6c5e9a6a46f0d2d1f97671462b9b6e9aff6",
  "targetOwner": "docs/platform/runner/contracts/routing-handoff.md",
  "targetAnchor": "câu-handoff-chuẩn",
  "targetUnitDigest": "236a8445d1599c3c1542451ef41fe6c5e9a6a46f0d2d1f97671462b9b6e9aff6",
  "targetAncestry": [
    "Routing Handoff Contract — fgos-runner"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/routing-handoff-contract.md#câu-handoff-chuẩn to docs/platform/runner/contracts/routing-handoff.md#câu-handoff-chuẩn. Carry the complete unit into its candidate contract owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/routing-handoff-contract.md#câu-handoff-chuẩn`
Source unit SHA256: `236a8445d1599c3c1542451ef41fe6c5e9a6a46f0d2d1f97671462b9b6e9aff6`
Shown source SHA256: `9b9755945276682367295dc612024bc87d304970c9b9c535c4b92719a883733d`

````text
## Câu handoff chuẩn

Mọi bước trong chain (runner → worker → review) khép lại bằng đúng một câu,
không paraphrase:

> "Việc `<id>` đã đề xuất trên nhánh `<fgw/id>` với goal-check tự chạy —
> chưa phải xong; cần duyệt/merge (per D4) mới thành `done`."

Khi từ chối (`proposed → todo`), câu tương ứng:

> "Việc `<id>` bị từ chối, lý do `<reason>`; quay lại `todo`, sẽ vào lại
> frontier trừ khi chạm anti-loop max-visits."
````

Target: `docs/platform/runner/contracts/routing-handoff.md#câu-handoff-chuẩn`
Target unit SHA256: `236a8445d1599c3c1542451ef41fe6c5e9a6a46f0d2d1f97671462b9b6e9aff6`
Shown target SHA256: `9b9755945276682367295dc612024bc87d304970c9b9c535c4b92719a883733d`

````text
## Câu handoff chuẩn

Mọi bước trong chain (runner → worker → review) khép lại bằng đúng một câu,
không paraphrase:

> "Việc `<id>` đã đề xuất trên nhánh `<fgw/id>` với goal-check tự chạy —
> chưa phải xong; cần duyệt/merge (per D4) mới thành `done`."

Khi từ chối (`proposed → todo`), câu tương ứng:

> "Việc `<id>` bị từ chối, lý do `<reason>`; quay lại `todo`, sẽ vào lại
> frontier trừ khi chạm anti-loop max-visits."
````

````diff

````
## source-decision claim_0a7c89cc79895b86926401a5c52139c9

Decision:

````json
{
  "claimId": "claim_0a7c89cc79895b86926401a5c52139c9",
  "sourceUnitDigest": "3e9d4aa6375656eb6da53d2a48f93c789d3f65e2ba76b742fe84a39aff8dde6d",
  "targetOwner": "docs/platform/runner/contracts/routing-handoff.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "3e9d4aa6375656eb6da53d2a48f93c789d3f65e2ba76b742fe84a39aff8dde6d",
  "targetAncestry": [
    "Routing Handoff Contract — fgos-runner",
    "Câu handoff chuẩn"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/routing-handoff-contract.md#unheaded-block-6 to docs/platform/runner/contracts/routing-handoff.md#unheaded-block-7. Carry the complete unit into its candidate contract owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/routing-handoff-contract.md#unheaded-block-6`
Source unit SHA256: `3e9d4aa6375656eb6da53d2a48f93c789d3f65e2ba76b742fe84a39aff8dde6d`
Shown source SHA256: `3e9d4aa6375656eb6da53d2a48f93c789d3f65e2ba76b742fe84a39aff8dde6d`

````text
Mọi bước trong chain (runner → worker → review) khép lại bằng đúng một câu,
không paraphrase:
````

Target: `docs/platform/runner/contracts/routing-handoff.md#unheaded-block-7`
Target unit SHA256: `3e9d4aa6375656eb6da53d2a48f93c789d3f65e2ba76b742fe84a39aff8dde6d`
Shown target SHA256: `3e9d4aa6375656eb6da53d2a48f93c789d3f65e2ba76b742fe84a39aff8dde6d`

````text
Mọi bước trong chain (runner → worker → review) khép lại bằng đúng một câu,
không paraphrase:
````

````diff

````
## source-decision claim_84b4604ace0a2db58f24992d07da524a

Decision:

````json
{
  "claimId": "claim_84b4604ace0a2db58f24992d07da524a",
  "sourceUnitDigest": "fda20ea3a88124927805fa832f84a08e91ca15e620654154c14427693839ec3b",
  "targetOwner": "docs/platform/runner/contracts/routing-handoff.md",
  "targetAnchor": "unheaded-block-8",
  "targetUnitDigest": "fda20ea3a88124927805fa832f84a08e91ca15e620654154c14427693839ec3b",
  "targetAncestry": [
    "Routing Handoff Contract — fgos-runner",
    "Câu handoff chuẩn"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/routing-handoff-contract.md#unheaded-block-7 to docs/platform/runner/contracts/routing-handoff.md#unheaded-block-8. Carry the complete unit into its candidate contract owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/routing-handoff-contract.md#unheaded-block-7`
Source unit SHA256: `fda20ea3a88124927805fa832f84a08e91ca15e620654154c14427693839ec3b`
Shown source SHA256: `fda20ea3a88124927805fa832f84a08e91ca15e620654154c14427693839ec3b`

````text
> "Việc `<id>` đã đề xuất trên nhánh `<fgw/id>` với goal-check tự chạy —
> chưa phải xong; cần duyệt/merge (per D4) mới thành `done`."
````

Target: `docs/platform/runner/contracts/routing-handoff.md#unheaded-block-8`
Target unit SHA256: `fda20ea3a88124927805fa832f84a08e91ca15e620654154c14427693839ec3b`
Shown target SHA256: `fda20ea3a88124927805fa832f84a08e91ca15e620654154c14427693839ec3b`

````text
> "Việc `<id>` đã đề xuất trên nhánh `<fgw/id>` với goal-check tự chạy —
> chưa phải xong; cần duyệt/merge (per D4) mới thành `done`."
````

````diff

````
## source-decision claim_8edd5a70b6ce8533b6f038a70c67982f

Decision:

````json
{
  "claimId": "claim_8edd5a70b6ce8533b6f038a70c67982f",
  "sourceUnitDigest": "b3cb0726462123aa6e4ef13561a6ad5ec6a0cf099f8d3cfd13007eb2a886a508",
  "targetOwner": "docs/platform/runner/contracts/routing-handoff.md",
  "targetAnchor": "unheaded-block-9",
  "targetUnitDigest": "b3cb0726462123aa6e4ef13561a6ad5ec6a0cf099f8d3cfd13007eb2a886a508",
  "targetAncestry": [
    "Routing Handoff Contract — fgos-runner",
    "Câu handoff chuẩn"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/routing-handoff-contract.md#unheaded-block-8 to docs/platform/runner/contracts/routing-handoff.md#unheaded-block-9. Carry the complete unit into its candidate contract owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/routing-handoff-contract.md#unheaded-block-8`
Source unit SHA256: `b3cb0726462123aa6e4ef13561a6ad5ec6a0cf099f8d3cfd13007eb2a886a508`
Shown source SHA256: `b3cb0726462123aa6e4ef13561a6ad5ec6a0cf099f8d3cfd13007eb2a886a508`

````text
Khi từ chối (`proposed → todo`), câu tương ứng:
````

Target: `docs/platform/runner/contracts/routing-handoff.md#unheaded-block-9`
Target unit SHA256: `b3cb0726462123aa6e4ef13561a6ad5ec6a0cf099f8d3cfd13007eb2a886a508`
Shown target SHA256: `b3cb0726462123aa6e4ef13561a6ad5ec6a0cf099f8d3cfd13007eb2a886a508`

````text
Khi từ chối (`proposed → todo`), câu tương ứng:
````

````diff

````
## source-decision claim_4c452af9d4fd2cbf5cf1d850746f0cb8

Decision:

````json
{
  "claimId": "claim_4c452af9d4fd2cbf5cf1d850746f0cb8",
  "sourceUnitDigest": "d40d1f008afc0371c6d83fe1704cd8d0e2f73f6c960d5f961abe8fac6aa1192f",
  "targetOwner": "docs/platform/runner/contracts/routing-handoff.md",
  "targetAnchor": "unheaded-block-10",
  "targetUnitDigest": "d40d1f008afc0371c6d83fe1704cd8d0e2f73f6c960d5f961abe8fac6aa1192f",
  "targetAncestry": [
    "Routing Handoff Contract — fgos-runner",
    "Câu handoff chuẩn"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/routing-handoff-contract.md#unheaded-block-9 to docs/platform/runner/contracts/routing-handoff.md#unheaded-block-10. Carry the complete unit into its candidate contract owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/routing-handoff-contract.md#unheaded-block-9`
Source unit SHA256: `d40d1f008afc0371c6d83fe1704cd8d0e2f73f6c960d5f961abe8fac6aa1192f`
Shown source SHA256: `d40d1f008afc0371c6d83fe1704cd8d0e2f73f6c960d5f961abe8fac6aa1192f`

````text
> "Việc `<id>` bị từ chối, lý do `<reason>`; quay lại `todo`, sẽ vào lại
> frontier trừ khi chạm anti-loop max-visits."
````

Target: `docs/platform/runner/contracts/routing-handoff.md#unheaded-block-10`
Target unit SHA256: `d40d1f008afc0371c6d83fe1704cd8d0e2f73f6c960d5f961abe8fac6aa1192f`
Shown target SHA256: `d40d1f008afc0371c6d83fe1704cd8d0e2f73f6c960d5f961abe8fac6aa1192f`

````text
> "Việc `<id>` bị từ chối, lý do `<reason>`; quay lại `todo`, sẽ vào lại
> frontier trừ khi chạm anti-loop max-visits."
````

````diff

````
## source-decision claim_f6f74edf2440be85e67f10b0b94c3e6c

Decision:

````json
{
  "claimId": "claim_f6f74edf2440be85e67f10b0b94c3e6c",
  "sourceUnitDigest": "77aa919785f50fd937355d98bc8012d9e5315375a1608f94ac9a315c6aecd871",
  "targetOwner": "docs/platform/runner/contracts/routing-handoff.md",
  "targetAnchor": "ranh-giới-tin-cậy",
  "targetUnitDigest": "77aa919785f50fd937355d98bc8012d9e5315375a1608f94ac9a315c6aecd871",
  "targetAncestry": [
    "Routing Handoff Contract — fgos-runner"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/routing-handoff-contract.md#ranh-giới-tin-cậy to docs/platform/runner/contracts/routing-handoff.md#ranh-giới-tin-cậy. Carry the complete unit into its candidate contract owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/routing-handoff-contract.md#ranh-giới-tin-cậy`
Source unit SHA256: `77aa919785f50fd937355d98bc8012d9e5315375a1608f94ac9a315c6aecd871`
Shown source SHA256: `94e896f46a85990a2490f7ce02d499dee73267a136be0648d4c2cd6b2b88a712`

````text
## Ranh giới tin cậy

Bất biến môi trường: mỗi agent khởi đầu tại project-root CỦA NÓ (git-root của cwd nó đứng); worker không bao giờ thấy harness phát triển của xưởng — cách ly vị trí đến từ worktree-trong-tmp, đo định kỳ bằng canary item (worker tự khai môi trường, verify assert). Diễn tập/canary không bao giờ ghi vào nhật ký sự kiện thật.

Ba bất biến, tách bạch rõ để không ai đọc nhầm đây là sandbox:

- **Containment bằng chỉ dẫn + nhánh vứt-được, KHÔNG PHẢI sandbox.** Worker
  chạy full quyền của user hiện tại (per `worktree.mjs`'s "SAME-USER TRUST
  INVARIANT"); cô lập ở đây nghĩa là "nhánh/worktree riêng, sai thì vứt" (D4),
  không phải giới hạn hệ điều hành nào. Không tin containment này chặn được
  một worker cố ý phá hoại.
- **Work item phải do chính user tạo.** `dispatch.mjs`'s "TRUST INVARIANT":
  `verify` chạy như một shell command thật (goal-check, D3) — một item nạp từ
  nguồn không được rà soát là một injection vector trước khi tới dispatch.
  Không bao giờ nối một intake path bên ngoài/không tin cậy vào `work` mà
  thiếu một cửa review ở giữa.
- **`.fgos/config.json`'s `runner` section là
  config THỰC THI ĐƯỢC, không phải dữ liệu thụ động.** Ai sửa được file này
  quyết định runner spawn tiến trình gì, với argument gì (per
  `dispatch.mjs`'s "TRUSTED-CONFIG NOTE"). File này committed (D2 — bền
  vĩnh viễn, review được như code) nhưng mang đúng mức tin cậy của code: chỉ
  áp dụng từ một checkout đã tin cậy sẵn.
- **Context ref tới kết quả vai/bước trước là đường dẫn tuyệt đối dưới
  `.fgos/assignments/` của main checkout.** Worker chỉ đọc, không ghi; runner
  kiểm sha256 lúc settle trước khi trao. Không mở rộng quyền đọc: worker vốn
  đọc được (`--ro-bind / /`, `hostRead: allow`). Câu trả lời của owner ở cổng
  người của một Workflow run cũng đi đường này (`gate-answer:` → file dưới
  `.fgos/workflow-runs/<id>/gate-answers/`): là input của owner, không phải
  output của agent khác, và brief nói rõ như vậy. Với `anonymizeInputs` các
  report được chép sang `<unitDir>/inputs/seat-*.md` để brief không lộ ai nói;
  đó chỉ là ẩn danh theo thứ được trao, không phải ranh giới đọc.
  Hợp đồng cấm worker *ghi* `.fgos`; Unit `blind: true` còn cấm nó *đọc* run state của
  peer (`.fgos/assignments`, `.fgos/workflow-runs`, `.fgos/dispatch-runs`, socket herdr,
  home và tiến trình của dispatch khác): vai blind chỉ đọc thư mục của chính nó (kết quả vai/bước trước tới nó dưới dạng bản chép nguyên byte
  trong `inputs/` của thư mục đó) và bị từ chối chạy nếu không thực thi được (`docs/specs/confinement-authority.md` §9.2).
````

Target: `docs/platform/runner/contracts/routing-handoff.md#ranh-giới-tin-cậy`
Target unit SHA256: `77aa919785f50fd937355d98bc8012d9e5315375a1608f94ac9a315c6aecd871`
Shown target SHA256: `94e896f46a85990a2490f7ce02d499dee73267a136be0648d4c2cd6b2b88a712`

````text
## Ranh giới tin cậy

Bất biến môi trường: mỗi agent khởi đầu tại project-root CỦA NÓ (git-root của cwd nó đứng); worker không bao giờ thấy harness phát triển của xưởng — cách ly vị trí đến từ worktree-trong-tmp, đo định kỳ bằng canary item (worker tự khai môi trường, verify assert). Diễn tập/canary không bao giờ ghi vào nhật ký sự kiện thật.

Ba bất biến, tách bạch rõ để không ai đọc nhầm đây là sandbox:

- **Containment bằng chỉ dẫn + nhánh vứt-được, KHÔNG PHẢI sandbox.** Worker
  chạy full quyền của user hiện tại (per `worktree.mjs`'s "SAME-USER TRUST
  INVARIANT"); cô lập ở đây nghĩa là "nhánh/worktree riêng, sai thì vứt" (D4),
  không phải giới hạn hệ điều hành nào. Không tin containment này chặn được
  một worker cố ý phá hoại.
- **Work item phải do chính user tạo.** `dispatch.mjs`'s "TRUST INVARIANT":
  `verify` chạy như một shell command thật (goal-check, D3) — một item nạp từ
  nguồn không được rà soát là một injection vector trước khi tới dispatch.
  Không bao giờ nối một intake path bên ngoài/không tin cậy vào `work` mà
  thiếu một cửa review ở giữa.
- **`.fgos/config.json`'s `runner` section là
  config THỰC THI ĐƯỢC, không phải dữ liệu thụ động.** Ai sửa được file này
  quyết định runner spawn tiến trình gì, với argument gì (per
  `dispatch.mjs`'s "TRUSTED-CONFIG NOTE"). File này committed (D2 — bền
  vĩnh viễn, review được như code) nhưng mang đúng mức tin cậy của code: chỉ
  áp dụng từ một checkout đã tin cậy sẵn.
- **Context ref tới kết quả vai/bước trước là đường dẫn tuyệt đối dưới
  `.fgos/assignments/` của main checkout.** Worker chỉ đọc, không ghi; runner
  kiểm sha256 lúc settle trước khi trao. Không mở rộng quyền đọc: worker vốn
  đọc được (`--ro-bind / /`, `hostRead: allow`). Câu trả lời của owner ở cổng
  người của một Workflow run cũng đi đường này (`gate-answer:` → file dưới
  `.fgos/workflow-runs/<id>/gate-answers/`): là input của owner, không phải
  output của agent khác, và brief nói rõ như vậy. Với `anonymizeInputs` các
  report được chép sang `<unitDir>/inputs/seat-*.md` để brief không lộ ai nói;
  đó chỉ là ẩn danh theo thứ được trao, không phải ranh giới đọc.
  Hợp đồng cấm worker *ghi* `.fgos`; Unit `blind: true` còn cấm nó *đọc* run state của
  peer (`.fgos/assignments`, `.fgos/workflow-runs`, `.fgos/dispatch-runs`, socket herdr,
  home và tiến trình của dispatch khác): vai blind chỉ đọc thư mục của chính nó (kết quả vai/bước trước tới nó dưới dạng bản chép nguyên byte
  trong `inputs/` của thư mục đó) và bị từ chối chạy nếu không thực thi được (`docs/specs/confinement-authority.md` §9.2).
````

````diff

````
## source-decision claim_46b432ac7a980081ce5ab550f9255fc3

Decision:

````json
{
  "claimId": "claim_46b432ac7a980081ce5ab550f9255fc3",
  "sourceUnitDigest": "4be0ec5bb2c597e320711f0bc22ad295d520b86c3fea127231150e767f8903cb",
  "targetOwner": "docs/platform/runner/contracts/routing-handoff.md",
  "targetAnchor": "unheaded-block-11",
  "targetUnitDigest": "4be0ec5bb2c597e320711f0bc22ad295d520b86c3fea127231150e767f8903cb",
  "targetAncestry": [
    "Routing Handoff Contract — fgos-runner",
    "Ranh giới tin cậy"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/routing-handoff-contract.md#unheaded-block-10 to docs/platform/runner/contracts/routing-handoff.md#unheaded-block-11. Carry the complete unit into its candidate contract owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/routing-handoff-contract.md#unheaded-block-10`
Source unit SHA256: `4be0ec5bb2c597e320711f0bc22ad295d520b86c3fea127231150e767f8903cb`
Shown source SHA256: `4be0ec5bb2c597e320711f0bc22ad295d520b86c3fea127231150e767f8903cb`

````text
Bất biến môi trường: mỗi agent khởi đầu tại project-root CỦA NÓ (git-root của cwd nó đứng); worker không bao giờ thấy harness phát triển của xưởng — cách ly vị trí đến từ worktree-trong-tmp, đo định kỳ bằng canary item (worker tự khai môi trường, verify assert). Diễn tập/canary không bao giờ ghi vào nhật ký sự kiện thật.
````

Target: `docs/platform/runner/contracts/routing-handoff.md#unheaded-block-11`
Target unit SHA256: `4be0ec5bb2c597e320711f0bc22ad295d520b86c3fea127231150e767f8903cb`
Shown target SHA256: `4be0ec5bb2c597e320711f0bc22ad295d520b86c3fea127231150e767f8903cb`

````text
Bất biến môi trường: mỗi agent khởi đầu tại project-root CỦA NÓ (git-root của cwd nó đứng); worker không bao giờ thấy harness phát triển của xưởng — cách ly vị trí đến từ worktree-trong-tmp, đo định kỳ bằng canary item (worker tự khai môi trường, verify assert). Diễn tập/canary không bao giờ ghi vào nhật ký sự kiện thật.
````

````diff

````
## source-decision claim_6ff6228ef9dad03e67f850b50ce066c4

Decision:

````json
{
  "claimId": "claim_6ff6228ef9dad03e67f850b50ce066c4",
  "sourceUnitDigest": "ef3f75a61f26da65653effa99f98b85a4a62e97464397094f73bd956124d892c",
  "targetOwner": "docs/platform/runner/contracts/routing-handoff.md",
  "targetAnchor": "unheaded-block-12",
  "targetUnitDigest": "ef3f75a61f26da65653effa99f98b85a4a62e97464397094f73bd956124d892c",
  "targetAncestry": [
    "Routing Handoff Contract — fgos-runner",
    "Ranh giới tin cậy"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/routing-handoff-contract.md#unheaded-block-11 to docs/platform/runner/contracts/routing-handoff.md#unheaded-block-12. Carry the complete unit into its candidate contract owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/routing-handoff-contract.md#unheaded-block-11`
Source unit SHA256: `ef3f75a61f26da65653effa99f98b85a4a62e97464397094f73bd956124d892c`
Shown source SHA256: `ef3f75a61f26da65653effa99f98b85a4a62e97464397094f73bd956124d892c`

````text
Ba bất biến, tách bạch rõ để không ai đọc nhầm đây là sandbox:
````

Target: `docs/platform/runner/contracts/routing-handoff.md#unheaded-block-12`
Target unit SHA256: `ef3f75a61f26da65653effa99f98b85a4a62e97464397094f73bd956124d892c`
Shown target SHA256: `ef3f75a61f26da65653effa99f98b85a4a62e97464397094f73bd956124d892c`

````text
Ba bất biến, tách bạch rõ để không ai đọc nhầm đây là sandbox:
````

````diff

````
## source-decision claim_e97ca9a63845ad04a307585c3d1ab9b0

Decision:

````json
{
  "claimId": "claim_e97ca9a63845ad04a307585c3d1ab9b0",
  "sourceUnitDigest": "219e04ff1e7f76c513c2326948e78ac7da7e7393b66fac04d3df089886479771",
  "targetOwner": "docs/platform/runner/contracts/routing-handoff.md",
  "targetAnchor": "unheaded-block-13",
  "targetUnitDigest": "219e04ff1e7f76c513c2326948e78ac7da7e7393b66fac04d3df089886479771",
  "targetAncestry": [
    "Routing Handoff Contract — fgos-runner",
    "Ranh giới tin cậy"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/routing-handoff-contract.md#unheaded-block-12 to docs/platform/runner/contracts/routing-handoff.md#unheaded-block-13. Carry the complete unit into its candidate contract owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/routing-handoff-contract.md#unheaded-block-12`
Source unit SHA256: `219e04ff1e7f76c513c2326948e78ac7da7e7393b66fac04d3df089886479771`
Shown source SHA256: `219e04ff1e7f76c513c2326948e78ac7da7e7393b66fac04d3df089886479771`

````text
- **Containment bằng chỉ dẫn + nhánh vứt-được, KHÔNG PHẢI sandbox.** Worker
  chạy full quyền của user hiện tại (per `worktree.mjs`'s "SAME-USER TRUST
  INVARIANT"); cô lập ở đây nghĩa là "nhánh/worktree riêng, sai thì vứt" (D4),
  không phải giới hạn hệ điều hành nào. Không tin containment này chặn được
  một worker cố ý phá hoại.
- **Work item phải do chính user tạo.** `dispatch.mjs`'s "TRUST INVARIANT":
  `verify` chạy như một shell command thật (goal-check, D3) — một item nạp từ
  nguồn không được rà soát là một injection vector trước khi tới dispatch.
  Không bao giờ nối một intake path bên ngoài/không tin cậy vào `work` mà
  thiếu một cửa review ở giữa.
- **`.fgos/config.json`'s `runner` section là
  config THỰC THI ĐƯỢC, không phải dữ liệu thụ động.** Ai sửa được file này
  quyết định runner spawn tiến trình gì, với argument gì (per
  `dispatch.mjs`'s "TRUSTED-CONFIG NOTE"). File này committed (D2 — bền
  vĩnh viễn, review được như code) nhưng mang đúng mức tin cậy của code: chỉ
  áp dụng từ một checkout đã tin cậy sẵn.
- **Context ref tới kết quả vai/bước trước là đường dẫn tuyệt đối dưới
  `.fgos/assignments/` của main checkout.** Worker chỉ đọc, không ghi; runner
  kiểm sha256 lúc settle trước khi trao. Không mở rộng quyền đọc: worker vốn
  đọc được (`--ro-bind / /`, `hostRead: allow`). Câu trả lời của owner ở cổng
  người của một Workflow run cũng đi đường này (`gate-answer:` → file dưới
  `.fgos/workflow-runs/<id>/gate-answers/`): là input của owner, không phải
  output của agent khác, và brief nói rõ như vậy. Với `anonymizeInputs` các
  report được chép sang `<unitDir>/inputs/seat-*.md` để brief không lộ ai nói;
  đó chỉ là ẩn danh theo thứ được trao, không phải ranh giới đọc.
  Hợp đồng cấm worker *ghi* `.fgos`; Unit `blind: true` còn cấm nó *đọc* run state của
  peer (`.fgos/assignments`, `.fgos/workflow-runs`, `.fgos/dispatch-runs`, socket herdr,
  home và tiến trình của dispatch khác): vai blind chỉ đọc thư mục của chính nó (kết quả vai/bước trước tới nó dưới dạng bản chép nguyên byte
  trong `inputs/` của thư mục đó) và bị từ chối chạy nếu không thực thi được (`docs/specs/confinement-authority.md` §9.2).
````

Target: `docs/platform/runner/contracts/routing-handoff.md#unheaded-block-13`
Target unit SHA256: `219e04ff1e7f76c513c2326948e78ac7da7e7393b66fac04d3df089886479771`
Shown target SHA256: `219e04ff1e7f76c513c2326948e78ac7da7e7393b66fac04d3df089886479771`

````text
- **Containment bằng chỉ dẫn + nhánh vứt-được, KHÔNG PHẢI sandbox.** Worker
  chạy full quyền của user hiện tại (per `worktree.mjs`'s "SAME-USER TRUST
  INVARIANT"); cô lập ở đây nghĩa là "nhánh/worktree riêng, sai thì vứt" (D4),
  không phải giới hạn hệ điều hành nào. Không tin containment này chặn được
  một worker cố ý phá hoại.
- **Work item phải do chính user tạo.** `dispatch.mjs`'s "TRUST INVARIANT":
  `verify` chạy như một shell command thật (goal-check, D3) — một item nạp từ
  nguồn không được rà soát là một injection vector trước khi tới dispatch.
  Không bao giờ nối một intake path bên ngoài/không tin cậy vào `work` mà
  thiếu một cửa review ở giữa.
- **`.fgos/config.json`'s `runner` section là
  config THỰC THI ĐƯỢC, không phải dữ liệu thụ động.** Ai sửa được file này
  quyết định runner spawn tiến trình gì, với argument gì (per
  `dispatch.mjs`'s "TRUSTED-CONFIG NOTE"). File này committed (D2 — bền
  vĩnh viễn, review được như code) nhưng mang đúng mức tin cậy của code: chỉ
  áp dụng từ một checkout đã tin cậy sẵn.
- **Context ref tới kết quả vai/bước trước là đường dẫn tuyệt đối dưới
  `.fgos/assignments/` của main checkout.** Worker chỉ đọc, không ghi; runner
  kiểm sha256 lúc settle trước khi trao. Không mở rộng quyền đọc: worker vốn
  đọc được (`--ro-bind / /`, `hostRead: allow`). Câu trả lời của owner ở cổng
  người của một Workflow run cũng đi đường này (`gate-answer:` → file dưới
  `.fgos/workflow-runs/<id>/gate-answers/`): là input của owner, không phải
  output của agent khác, và brief nói rõ như vậy. Với `anonymizeInputs` các
  report được chép sang `<unitDir>/inputs/seat-*.md` để brief không lộ ai nói;
  đó chỉ là ẩn danh theo thứ được trao, không phải ranh giới đọc.
  Hợp đồng cấm worker *ghi* `.fgos`; Unit `blind: true` còn cấm nó *đọc* run state của
  peer (`.fgos/assignments`, `.fgos/workflow-runs`, `.fgos/dispatch-runs`, socket herdr,
  home và tiến trình của dispatch khác): vai blind chỉ đọc thư mục của chính nó (kết quả vai/bước trước tới nó dưới dạng bản chép nguyên byte
  trong `inputs/` của thư mục đó) và bị từ chối chạy nếu không thực thi được (`docs/specs/confinement-authority.md` §9.2).
````

````diff

````
## source-decision claim_f8f15f9da87f6e77341cace39cdffd01

Decision:

````json
{
  "claimId": "claim_f8f15f9da87f6e77341cace39cdffd01",
  "sourceUnitDigest": "e6b3b341d3f8554716e1c13ad7c0278c8a34b5aed0d849640494c8f84d57e946",
  "targetOwner": "docs/platform/runner/contracts/routing-handoff.md",
  "targetAnchor": "tham-chiếu",
  "targetUnitDigest": "e6b3b341d3f8554716e1c13ad7c0278c8a34b5aed0d849640494c8f84d57e946",
  "targetAncestry": [
    "Routing Handoff Contract — fgos-runner"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/routing-handoff-contract.md#tham-chiếu to docs/platform/runner/contracts/routing-handoff.md#tham-chiếu. Carry the complete unit into its candidate contract owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/routing-handoff-contract.md#tham-chiếu`
Source unit SHA256: `e6b3b341d3f8554716e1c13ad7c0278c8a34b5aed0d849640494c8f84d57e946`
Shown source SHA256: `33d1fff8ed82c61abd14a82a397ad61cc16743e2b457e12ee801f6ce261f7d6d`

````text
## Tham chiếu

`src/runner/dispatch.mjs` (prompt + trust invariant) · `src/runner/worktree.mjs`
(same-user trust invariant) · `docs/platform-foundations.md` L4 (`14ebeea9`)
· `docs/specs/runner.md` (ADR-0005 Runner & cô lập worker, D3/D4).
````

Target: `docs/platform/runner/contracts/routing-handoff.md#tham-chiếu`
Target unit SHA256: `e6b3b341d3f8554716e1c13ad7c0278c8a34b5aed0d849640494c8f84d57e946`
Shown target SHA256: `33d1fff8ed82c61abd14a82a397ad61cc16743e2b457e12ee801f6ce261f7d6d`

````text
## Tham chiếu

`src/runner/dispatch.mjs` (prompt + trust invariant) · `src/runner/worktree.mjs`
(same-user trust invariant) · `docs/platform-foundations.md` L4 (`14ebeea9`)
· `docs/specs/runner.md` (ADR-0005 Runner & cô lập worker, D3/D4).
````

````diff

````
## source-decision claim_e07c67fc7548e82a45695e821af2558f

Decision:

````json
{
  "claimId": "claim_e07c67fc7548e82a45695e821af2558f",
  "sourceUnitDigest": "7aca3755b9d4f4f1826236f51b161291ff58d7dca9d6e1dc2bf1f26a10bcc792",
  "targetOwner": "docs/platform/runner/contracts/routing-handoff.md",
  "targetAnchor": "unheaded-block-14",
  "targetUnitDigest": "7aca3755b9d4f4f1826236f51b161291ff58d7dca9d6e1dc2bf1f26a10bcc792",
  "targetAncestry": [
    "Routing Handoff Contract — fgos-runner",
    "Tham chiếu"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/routing-handoff-contract.md#unheaded-block-13 to docs/platform/runner/contracts/routing-handoff.md#unheaded-block-14. Carry the complete unit into its candidate contract owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/routing-handoff-contract.md#unheaded-block-13`
Source unit SHA256: `7aca3755b9d4f4f1826236f51b161291ff58d7dca9d6e1dc2bf1f26a10bcc792`
Shown source SHA256: `7aca3755b9d4f4f1826236f51b161291ff58d7dca9d6e1dc2bf1f26a10bcc792`

````text
`src/runner/dispatch.mjs` (prompt + trust invariant) · `src/runner/worktree.mjs`
(same-user trust invariant) · `docs/platform-foundations.md` L4 (`14ebeea9`)
· `docs/specs/runner.md` (ADR-0005 Runner & cô lập worker, D3/D4).
````

Target: `docs/platform/runner/contracts/routing-handoff.md#unheaded-block-14`
Target unit SHA256: `7aca3755b9d4f4f1826236f51b161291ff58d7dca9d6e1dc2bf1f26a10bcc792`
Shown target SHA256: `7aca3755b9d4f4f1826236f51b161291ff58d7dca9d6e1dc2bf1f26a10bcc792`

````text
`src/runner/dispatch.mjs` (prompt + trust invariant) · `src/runner/worktree.mjs`
(same-user trust invariant) · `docs/platform-foundations.md` L4 (`14ebeea9`)
· `docs/specs/runner.md` (ADR-0005 Runner & cô lập worker, D3/D4).
````

````diff

````
## source-decision claim_60329d1f27688d4a78c094951d5ac119

Decision:

````json
{
  "claimId": "claim_60329d1f27688d4a78c094951d5ac119",
  "sourceUnitDigest": "7925a22c5b9ca7992f7053732f7597773fa8efdfdb2d9a443a1ee090f772c7d0",
  "targetOwner": "docs/platform/packaging-distribution/history/distribution-vision.md",
  "targetAnchor": "cài-đặt-setup-doctor-của-fgos-tầm-nhìn-nền-tảng",
  "targetUnitDigest": "06fb53a3c6d19df7acef7ce97786b4304fb88eb4797869e216cf75ba31f52d80",
  "targetAncestry": [],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/distribution-vision.md#cài-đặt-setup-doctor-của-fgos-tầm-nhìn-nền-tảng to docs/platform/packaging-distribution/history/distribution-vision.md#cài-đặt-setup-doctor-của-fgos-tầm-nhìn-nền-tảng. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/distribution-vision.md#cài-đặt-setup-doctor-của-fgos-tầm-nhìn-nền-tảng`
Source unit SHA256: `7925a22c5b9ca7992f7053732f7597773fa8efdfdb2d9a443a1ee090f772c7d0`
Shown source SHA256: `92b6e0e2eeb9014ee26800ba103e45c17c87fbfa449a0d37e157ff21df99c2aa`

````text
# Cài đặt / Setup / Doctor của fgOS — tầm nhìn nền tảng

```txt
Legacy status: Promoted source
Promoted to: docs/platform/packaging-distribution/vision.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Historical wording, original rationale, and supersession trace
Do not use this legacy file for: Current implementation status or canonical area navigation
Last reviewed: 2026-09-13
```

**Trạng thái:** TẦM NHÌN / ĐỊNH HƯỚNG — chưa khoá thành luật (platform-foundations)
hay spec đầy đủ; nhiều điểm còn là câu hỏi mở kiến trúc. **Ngày:** 2026-08-01.
**Nguồn:** định hướng của chủ sản phẩm.

Tài liệu này ghi lại tầm nhìn cho mảng cài đặt/setup/doctor để không mất, và
làm khung cho backlog kế tiếp của mảng này. Nó mở rộng — không thay — spec
hiện có: `docs/specs/distribution.md` (area: distribution) và
`docs/coexistence.md` (doctrine chạy cạnh harness khác). Một số điểm dưới đây
**đảo ngược** một quyết định đã chốt trong distribution.md (nêu rõ ở §3).
````

Target: `docs/platform/packaging-distribution/history/distribution-vision.md#cài-đặt-setup-doctor-của-fgos-tầm-nhìn-nền-tảng`
Target unit SHA256: `06fb53a3c6d19df7acef7ce97786b4304fb88eb4797869e216cf75ba31f52d80`
Shown target SHA256: `7b10a9b912a5433f1779ddff4d03f0327f19cf303b123d805e34e79adef8af49`

````text
# Cài đặt / Setup / Doctor của fgOS — tầm nhìn nền tảng

```txt
Document type: History
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve the mapped source as candidate material for conservation review
Design status: Candidate
Implementation: Historical source retained; current truth not certified
Provenance: docs/distribution-vision.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing conservation of the mapped legacy source
Do not use this for: Current canonical authority or proof of implemented behavior
Last reviewed: 2026-10-14
Related:
- docs/distribution-vision.md
Supersedes: None; candidate only
Superseded by: None
```

```txt
Legacy status: Promoted source
Promoted to: docs/platform/packaging-distribution/vision.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Historical wording, original rationale, and supersession trace
Do not use this legacy file for: Current implementation status or canonical area navigation
Last reviewed: 2026-09-13
```

**Trạng thái:** TẦM NHÌN / ĐỊNH HƯỚNG — chưa khoá thành luật (platform-foundations)
hay spec đầy đủ; nhiều điểm còn là câu hỏi mở kiến trúc. **Ngày:** 2026-08-01.
**Nguồn:** định hướng của chủ sản phẩm.

Tài liệu này ghi lại tầm nhìn cho mảng cài đặt/setup/doctor để không mất, và
làm khung cho backlog kế tiếp của mảng này. Nó mở rộng — không thay — spec
hiện có: `docs/specs/distribution.md` (area: distribution) và
`docs/coexistence.md` (doctrine chạy cạnh harness khác). Một số điểm dưới đây
**đảo ngược** một quyết định đã chốt trong distribution.md (nêu rõ ở §3).
````

````diff
--- docs/distribution-vision.md
+++ docs/platform/packaging-distribution/history/distribution-vision.md
@@ -1,0 +2,19 @@
+
+```txt
+Document type: History
+Audience: Documentation migration reviewer, maintainer, agent
+Purpose: Preserve the mapped source as candidate material for conservation review
+Design status: Candidate
+Implementation: Historical source retained; current truth not certified
+Provenance: docs/distribution-vision.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
+Writer type: Agent draft writer
+Canonical: No
+Canonical for: None; candidate only
+Use this when: Reviewing conservation of the mapped legacy source
+Do not use this for: Current canonical authority or proof of implemented behavior
+Last reviewed: 2026-10-14
+Related:
+- docs/distribution-vision.md
+Supersedes: None; candidate only
+Superseded by: None
+```
````
## source-decision claim_8e5a87cedeff99cfae48de4e8d8b166a

Decision:

````json
{
  "claimId": "claim_8e5a87cedeff99cfae48de4e8d8b166a",
  "sourceUnitDigest": "21b1a5518c252574eef4a55ae3c2b68e285f3a608dc36edce540d01169291822",
  "targetOwner": "docs/platform/packaging-distribution/history/distribution-vision.md",
  "targetAnchor": "unheaded-block-2",
  "targetUnitDigest": "21b1a5518c252574eef4a55ae3c2b68e285f3a608dc36edce540d01169291822",
  "targetAncestry": [
    "Cài đặt / Setup / Doctor của fgOS — tầm nhìn nền tảng"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/distribution-vision.md#unheaded-block-1 to docs/platform/packaging-distribution/history/distribution-vision.md#unheaded-block-2. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/distribution-vision.md#unheaded-block-1`
Source unit SHA256: `21b1a5518c252574eef4a55ae3c2b68e285f3a608dc36edce540d01169291822`
Shown source SHA256: `21b1a5518c252574eef4a55ae3c2b68e285f3a608dc36edce540d01169291822`

````text
```txt
Legacy status: Promoted source
Promoted to: docs/platform/packaging-distribution/vision.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Historical wording, original rationale, and supersession trace
Do not use this legacy file for: Current implementation status or canonical area navigation
Last reviewed: 2026-09-13
```
````

Target: `docs/platform/packaging-distribution/history/distribution-vision.md#unheaded-block-2`
Target unit SHA256: `21b1a5518c252574eef4a55ae3c2b68e285f3a608dc36edce540d01169291822`
Shown target SHA256: `21b1a5518c252574eef4a55ae3c2b68e285f3a608dc36edce540d01169291822`

````text
```txt
Legacy status: Promoted source
Promoted to: docs/platform/packaging-distribution/vision.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Historical wording, original rationale, and supersession trace
Do not use this legacy file for: Current implementation status or canonical area navigation
Last reviewed: 2026-09-13
```
````

````diff

````
## source-decision claim_ca1d4e99958089ae33b304dbfa42e7ed

Decision:

````json
{
  "claimId": "claim_ca1d4e99958089ae33b304dbfa42e7ed",
  "sourceUnitDigest": "e512a70add10d9c1732227124aa07cb5a15f48def15914877e8e033a857da9f0",
  "targetOwner": "docs/platform/packaging-distribution/history/distribution-vision.md",
  "targetAnchor": "unheaded-block-3",
  "targetUnitDigest": "e512a70add10d9c1732227124aa07cb5a15f48def15914877e8e033a857da9f0",
  "targetAncestry": [
    "Cài đặt / Setup / Doctor của fgOS — tầm nhìn nền tảng"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/distribution-vision.md#unheaded-block-2 to docs/platform/packaging-distribution/history/distribution-vision.md#unheaded-block-3. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/distribution-vision.md#unheaded-block-2`
Source unit SHA256: `e512a70add10d9c1732227124aa07cb5a15f48def15914877e8e033a857da9f0`
Shown source SHA256: `e512a70add10d9c1732227124aa07cb5a15f48def15914877e8e033a857da9f0`

````text
**Trạng thái:** TẦM NHÌN / ĐỊNH HƯỚNG — chưa khoá thành luật (platform-foundations)
hay spec đầy đủ; nhiều điểm còn là câu hỏi mở kiến trúc. **Ngày:** 2026-08-01.
**Nguồn:** định hướng của chủ sản phẩm.
````

Target: `docs/platform/packaging-distribution/history/distribution-vision.md#unheaded-block-3`
Target unit SHA256: `e512a70add10d9c1732227124aa07cb5a15f48def15914877e8e033a857da9f0`
Shown target SHA256: `e512a70add10d9c1732227124aa07cb5a15f48def15914877e8e033a857da9f0`

````text
**Trạng thái:** TẦM NHÌN / ĐỊNH HƯỚNG — chưa khoá thành luật (platform-foundations)
hay spec đầy đủ; nhiều điểm còn là câu hỏi mở kiến trúc. **Ngày:** 2026-08-01.
**Nguồn:** định hướng của chủ sản phẩm.
````

````diff

````
## source-decision claim_853f34cbff0d9d2b87f8b02ee06f4f39

Decision:

````json
{
  "claimId": "claim_853f34cbff0d9d2b87f8b02ee06f4f39",
  "sourceUnitDigest": "53eb117e67467159cfc251090d76b74ba765b1c838f8358732ef534aba995f2b",
  "targetOwner": "docs/platform/packaging-distribution/history/distribution-vision.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "53eb117e67467159cfc251090d76b74ba765b1c838f8358732ef534aba995f2b",
  "targetAncestry": [
    "Cài đặt / Setup / Doctor của fgOS — tầm nhìn nền tảng"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/distribution-vision.md#unheaded-block-3 to docs/platform/packaging-distribution/history/distribution-vision.md#unheaded-block-4. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/distribution-vision.md#unheaded-block-3`
Source unit SHA256: `53eb117e67467159cfc251090d76b74ba765b1c838f8358732ef534aba995f2b`
Shown source SHA256: `53eb117e67467159cfc251090d76b74ba765b1c838f8358732ef534aba995f2b`

````text
Tài liệu này ghi lại tầm nhìn cho mảng cài đặt/setup/doctor để không mất, và
làm khung cho backlog kế tiếp của mảng này. Nó mở rộng — không thay — spec
hiện có: `docs/specs/distribution.md` (area: distribution) và
`docs/coexistence.md` (doctrine chạy cạnh harness khác). Một số điểm dưới đây
**đảo ngược** một quyết định đã chốt trong distribution.md (nêu rõ ở §3).
````

Target: `docs/platform/packaging-distribution/history/distribution-vision.md#unheaded-block-4`
Target unit SHA256: `53eb117e67467159cfc251090d76b74ba765b1c838f8358732ef534aba995f2b`
Shown target SHA256: `53eb117e67467159cfc251090d76b74ba765b1c838f8358732ef534aba995f2b`

````text
Tài liệu này ghi lại tầm nhìn cho mảng cài đặt/setup/doctor để không mất, và
làm khung cho backlog kế tiếp của mảng này. Nó mở rộng — không thay — spec
hiện có: `docs/specs/distribution.md` (area: distribution) và
`docs/coexistence.md` (doctrine chạy cạnh harness khác). Một số điểm dưới đây
**đảo ngược** một quyết định đã chốt trong distribution.md (nêu rõ ở §3).
````

````diff

````
## source-decision claim_4777347f1ce26d83ee5b5e73dc304ae0

Decision:

````json
{
  "claimId": "claim_4777347f1ce26d83ee5b5e73dc304ae0",
  "sourceUnitDigest": "0428e939eea773538c0a486dfc6c8ebedbe0e50602adef9b92cf61b1b36524ce",
  "targetOwner": "docs/platform/packaging-distribution/history/distribution-vision.md",
  "targetAnchor": "1-vì-sao",
  "targetUnitDigest": "0428e939eea773538c0a486dfc6c8ebedbe0e50602adef9b92cf61b1b36524ce",
  "targetAncestry": [
    "Cài đặt / Setup / Doctor của fgOS — tầm nhìn nền tảng"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/distribution-vision.md#1-vì-sao to docs/platform/packaging-distribution/history/distribution-vision.md#1-vì-sao. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/distribution-vision.md#1-vì-sao`
Source unit SHA256: `0428e939eea773538c0a486dfc6c8ebedbe0e50602adef9b92cf61b1b36524ce`
Shown source SHA256: `ac17acbd0a8bdbcc198b40678b928c4144277b800e1d8d0bba39ea89f39ba6d1`

````text
## 1. Vì sao

fgOS đang được dogfood ngay trên chính repo tạo ra nó. Muốn tái sử dụng fgOS ở
project/máy khác (và cho người khác cài), đường cài đặt/setup/doctor phải
**ổn định** trước — không phải một tiện ích phụ, mà là hạ tầng nền cho việc
mảng còn lại của sản phẩm có tái dùng được hay không.
````

Target: `docs/platform/packaging-distribution/history/distribution-vision.md#1-vì-sao`
Target unit SHA256: `0428e939eea773538c0a486dfc6c8ebedbe0e50602adef9b92cf61b1b36524ce`
Shown target SHA256: `ac17acbd0a8bdbcc198b40678b928c4144277b800e1d8d0bba39ea89f39ba6d1`

````text
## 1. Vì sao

fgOS đang được dogfood ngay trên chính repo tạo ra nó. Muốn tái sử dụng fgOS ở
project/máy khác (và cho người khác cài), đường cài đặt/setup/doctor phải
**ổn định** trước — không phải một tiện ích phụ, mà là hạ tầng nền cho việc
mảng còn lại của sản phẩm có tái dùng được hay không.
````

````diff

````
## source-decision claim_bc505ae7ed821eea7f8bd10ca4305d9e

Decision:

````json
{
  "claimId": "claim_bc505ae7ed821eea7f8bd10ca4305d9e",
  "sourceUnitDigest": "ea373321d21ced4ebd772cf7935e59faa1f24fb4b28136b4a27e29ebe2a1bf24",
  "targetOwner": "docs/platform/packaging-distribution/history/distribution-vision.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "ea373321d21ced4ebd772cf7935e59faa1f24fb4b28136b4a27e29ebe2a1bf24",
  "targetAncestry": [
    "Cài đặt / Setup / Doctor của fgOS — tầm nhìn nền tảng",
    "1. Vì sao"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/distribution-vision.md#unheaded-block-4 to docs/platform/packaging-distribution/history/distribution-vision.md#unheaded-block-5. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/distribution-vision.md#unheaded-block-4`
Source unit SHA256: `ea373321d21ced4ebd772cf7935e59faa1f24fb4b28136b4a27e29ebe2a1bf24`
Shown source SHA256: `ea373321d21ced4ebd772cf7935e59faa1f24fb4b28136b4a27e29ebe2a1bf24`

````text
fgOS đang được dogfood ngay trên chính repo tạo ra nó. Muốn tái sử dụng fgOS ở
project/máy khác (và cho người khác cài), đường cài đặt/setup/doctor phải
**ổn định** trước — không phải một tiện ích phụ, mà là hạ tầng nền cho việc
mảng còn lại của sản phẩm có tái dùng được hay không.
````

Target: `docs/platform/packaging-distribution/history/distribution-vision.md#unheaded-block-5`
Target unit SHA256: `ea373321d21ced4ebd772cf7935e59faa1f24fb4b28136b4a27e29ebe2a1bf24`
Shown target SHA256: `ea373321d21ced4ebd772cf7935e59faa1f24fb4b28136b4a27e29ebe2a1bf24`

````text
fgOS đang được dogfood ngay trên chính repo tạo ra nó. Muốn tái sử dụng fgOS ở
project/máy khác (và cho người khác cài), đường cài đặt/setup/doctor phải
**ổn định** trước — không phải một tiện ích phụ, mà là hạ tầng nền cho việc
mảng còn lại của sản phẩm có tái dùng được hay không.
````

````diff

````
## source-decision claim_c859a74c1479db17ac092f3256da0ff9

Decision:

````json
{
  "claimId": "claim_c859a74c1479db17ac092f3256da0ff9",
  "sourceUnitDigest": "5e88aa9af5b576fbcce76c81cc4f64e5e5fcd5383fb9ed7019eb2ee5fdc254cb",
  "targetOwner": "docs/platform/packaging-distribution/history/distribution-vision.md",
  "targetAnchor": "2-bảy-trụ-cột-của-tầm-nhìn",
  "targetUnitDigest": "5e88aa9af5b576fbcce76c81cc4f64e5e5fcd5383fb9ed7019eb2ee5fdc254cb",
  "targetAncestry": [
    "Cài đặt / Setup / Doctor của fgOS — tầm nhìn nền tảng"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/distribution-vision.md#2-bảy-trụ-cột-của-tầm-nhìn to docs/platform/packaging-distribution/history/distribution-vision.md#2-bảy-trụ-cột-của-tầm-nhìn. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/distribution-vision.md#2-bảy-trụ-cột-của-tầm-nhìn`
Source unit SHA256: `5e88aa9af5b576fbcce76c81cc4f64e5e5fcd5383fb9ed7019eb2ee5fdc254cb`
Shown source SHA256: `e86760f56657016e01cdfb41e853ba7afc2f776a6d2220e35f4906ca52847195`

````text
## 2. Bảy trụ cột của tầm nhìn

1. **Cài đặt không cần clone.** Người dùng lấy được `fgos`/`fgos-runner` mà
   không cần tự tay `git clone` repo nguồn trước.
2. **Hai cấp cài đặt: global hoặc project.** Cả hai cấp đều là cách cài hợp
   lệ, không cấp nào là "chính", cấp nào là "phụ".
3. **`setup`/`doctor` luôn tự sửa được mọi thứ cần để fgOS chạy tốt** —
   upgrade/update bản đã cài, init mới, VÀ fix mọi hạ tầng cần thiết + merge
   cấu hình mới vào cấu hình đã có + điền cấu hình còn thiếu. Không dừng ở
   "báo cáo rồi im" — phải tự sửa được, không chỉ chẩn đoán.
4. **Setup/config phải mở được cho module mới.** Bất kỳ chức năng/module mới
   nào cũng có đường chính thức để đăng ký thêm năng lực cấu hình của nó vào
   `setup`/`doctor` tổng — không phải mỗi module tự vá tay một chỗ riêng.
5. **Mọi thay đổi mới đều phải tự hỏi: có đụng cấu hình/config không? có cần
   hạ tầng đặc biệt nào cần setup hỗ trợ không?** Đây là một câu hỏi bắt buộc
   cho MỌI công việc trong project này, không riêng việc thuộc mảng
   cài đặt — xem §5 (gate áp dụng toàn project).
6. **Global và project không xung đột.** fgOS luôn nhận biết (aware) được cả
   hai cấp đang tồn tại; nếu project có cài fgOS riêng thì bộ ở project được
   ưu tiên vận hành, không có thì rơi về global; **cấu hình của project luôn
   ghi đè (overwrite) cấu hình global** — không phải hợp nhất mù hai bên.
   **Cập nhật 2026-08-01:** còn một CONTEXT THỨ 3 nằm ngoài cặp global/project
   — dev-checkout self-hosting (contributor phát triển CHÍNH fgOS qua
   `scripts/fgos-shell-integration.sh`, không cài đặt gì). Ba context này
   phải cùng "không xung đột" trên một máy, không chỉ hai. Xem §3 cho phát
   hiện thật (đọc code) về va chạm cụ thể giữa context này với global-install.
7. **CI/GitHub CI workflow là một phần của bộ setup.** CI giúp fgOS ổn định +
   sẵn sàng ngay khi cài, giảm bớt việc phải tự dò các ràng buộc môi trường
   ngay tại máy người dùng — kiểm trước ở CI thay vì để người dùng tự đụng.
````

Target: `docs/platform/packaging-distribution/history/distribution-vision.md#2-bảy-trụ-cột-của-tầm-nhìn`
Target unit SHA256: `5e88aa9af5b576fbcce76c81cc4f64e5e5fcd5383fb9ed7019eb2ee5fdc254cb`
Shown target SHA256: `e86760f56657016e01cdfb41e853ba7afc2f776a6d2220e35f4906ca52847195`

````text
## 2. Bảy trụ cột của tầm nhìn

1. **Cài đặt không cần clone.** Người dùng lấy được `fgos`/`fgos-runner` mà
   không cần tự tay `git clone` repo nguồn trước.
2. **Hai cấp cài đặt: global hoặc project.** Cả hai cấp đều là cách cài hợp
   lệ, không cấp nào là "chính", cấp nào là "phụ".
3. **`setup`/`doctor` luôn tự sửa được mọi thứ cần để fgOS chạy tốt** —
   upgrade/update bản đã cài, init mới, VÀ fix mọi hạ tầng cần thiết + merge
   cấu hình mới vào cấu hình đã có + điền cấu hình còn thiếu. Không dừng ở
   "báo cáo rồi im" — phải tự sửa được, không chỉ chẩn đoán.
4. **Setup/config phải mở được cho module mới.** Bất kỳ chức năng/module mới
   nào cũng có đường chính thức để đăng ký thêm năng lực cấu hình của nó vào
   `setup`/`doctor` tổng — không phải mỗi module tự vá tay một chỗ riêng.
5. **Mọi thay đổi mới đều phải tự hỏi: có đụng cấu hình/config không? có cần
   hạ tầng đặc biệt nào cần setup hỗ trợ không?** Đây là một câu hỏi bắt buộc
   cho MỌI công việc trong project này, không riêng việc thuộc mảng
   cài đặt — xem §5 (gate áp dụng toàn project).
6. **Global và project không xung đột.** fgOS luôn nhận biết (aware) được cả
   hai cấp đang tồn tại; nếu project có cài fgOS riêng thì bộ ở project được
   ưu tiên vận hành, không có thì rơi về global; **cấu hình của project luôn
   ghi đè (overwrite) cấu hình global** — không phải hợp nhất mù hai bên.
   **Cập nhật 2026-08-01:** còn một CONTEXT THỨ 3 nằm ngoài cặp global/project
   — dev-checkout self-hosting (contributor phát triển CHÍNH fgOS qua
   `scripts/fgos-shell-integration.sh`, không cài đặt gì). Ba context này
   phải cùng "không xung đột" trên một máy, không chỉ hai. Xem §3 cho phát
   hiện thật (đọc code) về va chạm cụ thể giữa context này với global-install.
7. **CI/GitHub CI workflow là một phần của bộ setup.** CI giúp fgOS ổn định +
   sẵn sàng ngay khi cài, giảm bớt việc phải tự dò các ràng buộc môi trường
   ngay tại máy người dùng — kiểm trước ở CI thay vì để người dùng tự đụng.
````

````diff

````
## source-decision claim_76ba549bdef724715f89182e5c6a857d

Decision:

````json
{
  "claimId": "claim_76ba549bdef724715f89182e5c6a857d",
  "sourceUnitDigest": "6a8d7e629b0c2c751e982db8a8790f1a19a0ab377523ea5c903e72608c9895ac",
  "targetOwner": "docs/platform/packaging-distribution/history/distribution-vision.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "6a8d7e629b0c2c751e982db8a8790f1a19a0ab377523ea5c903e72608c9895ac",
  "targetAncestry": [
    "Cài đặt / Setup / Doctor của fgOS — tầm nhìn nền tảng",
    "2. Bảy trụ cột của tầm nhìn"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/distribution-vision.md#unheaded-block-5 to docs/platform/packaging-distribution/history/distribution-vision.md#unheaded-block-6. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/distribution-vision.md#unheaded-block-5`
Source unit SHA256: `6a8d7e629b0c2c751e982db8a8790f1a19a0ab377523ea5c903e72608c9895ac`
Shown source SHA256: `6a8d7e629b0c2c751e982db8a8790f1a19a0ab377523ea5c903e72608c9895ac`

````text
1. **Cài đặt không cần clone.** Người dùng lấy được `fgos`/`fgos-runner` mà
   không cần tự tay `git clone` repo nguồn trước.
2. **Hai cấp cài đặt: global hoặc project.** Cả hai cấp đều là cách cài hợp
   lệ, không cấp nào là "chính", cấp nào là "phụ".
3. **`setup`/`doctor` luôn tự sửa được mọi thứ cần để fgOS chạy tốt** —
   upgrade/update bản đã cài, init mới, VÀ fix mọi hạ tầng cần thiết + merge
   cấu hình mới vào cấu hình đã có + điền cấu hình còn thiếu. Không dừng ở
   "báo cáo rồi im" — phải tự sửa được, không chỉ chẩn đoán.
4. **Setup/config phải mở được cho module mới.** Bất kỳ chức năng/module mới
   nào cũng có đường chính thức để đăng ký thêm năng lực cấu hình của nó vào
   `setup`/`doctor` tổng — không phải mỗi module tự vá tay một chỗ riêng.
5. **Mọi thay đổi mới đều phải tự hỏi: có đụng cấu hình/config không? có cần
   hạ tầng đặc biệt nào cần setup hỗ trợ không?** Đây là một câu hỏi bắt buộc
   cho MỌI công việc trong project này, không riêng việc thuộc mảng
   cài đặt — xem §5 (gate áp dụng toàn project).
6. **Global và project không xung đột.** fgOS luôn nhận biết (aware) được cả
   hai cấp đang tồn tại; nếu project có cài fgOS riêng thì bộ ở project được
   ưu tiên vận hành, không có thì rơi về global; **cấu hình của project luôn
   ghi đè (overwrite) cấu hình global** — không phải hợp nhất mù hai bên.
   **Cập nhật 2026-08-01:** còn một CONTEXT THỨ 3 nằm ngoài cặp global/project
   — dev-checkout self-hosting (contributor phát triển CHÍNH fgOS qua
   `scripts/fgos-shell-integration.sh`, không cài đặt gì). Ba context này
   phải cùng "không xung đột" trên một máy, không chỉ hai. Xem §3 cho phát
   hiện thật (đọc code) về va chạm cụ thể giữa context này với global-install.
7. **CI/GitHub CI workflow là một phần của bộ setup.** CI giúp fgOS ổn định +
   sẵn sàng ngay khi cài, giảm bớt việc phải tự dò các ràng buộc môi trường
   ngay tại máy người dùng — kiểm trước ở CI thay vì để người dùng tự đụng.
````

Target: `docs/platform/packaging-distribution/history/distribution-vision.md#unheaded-block-6`
Target unit SHA256: `6a8d7e629b0c2c751e982db8a8790f1a19a0ab377523ea5c903e72608c9895ac`
Shown target SHA256: `6a8d7e629b0c2c751e982db8a8790f1a19a0ab377523ea5c903e72608c9895ac`

````text
1. **Cài đặt không cần clone.** Người dùng lấy được `fgos`/`fgos-runner` mà
   không cần tự tay `git clone` repo nguồn trước.
2. **Hai cấp cài đặt: global hoặc project.** Cả hai cấp đều là cách cài hợp
   lệ, không cấp nào là "chính", cấp nào là "phụ".
3. **`setup`/`doctor` luôn tự sửa được mọi thứ cần để fgOS chạy tốt** —
   upgrade/update bản đã cài, init mới, VÀ fix mọi hạ tầng cần thiết + merge
   cấu hình mới vào cấu hình đã có + điền cấu hình còn thiếu. Không dừng ở
   "báo cáo rồi im" — phải tự sửa được, không chỉ chẩn đoán.
4. **Setup/config phải mở được cho module mới.** Bất kỳ chức năng/module mới
   nào cũng có đường chính thức để đăng ký thêm năng lực cấu hình của nó vào
   `setup`/`doctor` tổng — không phải mỗi module tự vá tay một chỗ riêng.
5. **Mọi thay đổi mới đều phải tự hỏi: có đụng cấu hình/config không? có cần
   hạ tầng đặc biệt nào cần setup hỗ trợ không?** Đây là một câu hỏi bắt buộc
   cho MỌI công việc trong project này, không riêng việc thuộc mảng
   cài đặt — xem §5 (gate áp dụng toàn project).
6. **Global và project không xung đột.** fgOS luôn nhận biết (aware) được cả
   hai cấp đang tồn tại; nếu project có cài fgOS riêng thì bộ ở project được
   ưu tiên vận hành, không có thì rơi về global; **cấu hình của project luôn
   ghi đè (overwrite) cấu hình global** — không phải hợp nhất mù hai bên.
   **Cập nhật 2026-08-01:** còn một CONTEXT THỨ 3 nằm ngoài cặp global/project
   — dev-checkout self-hosting (contributor phát triển CHÍNH fgOS qua
   `scripts/fgos-shell-integration.sh`, không cài đặt gì). Ba context này
   phải cùng "không xung đột" trên một máy, không chỉ hai. Xem §3 cho phát
   hiện thật (đọc code) về va chạm cụ thể giữa context này với global-install.
7. **CI/GitHub CI workflow là một phần của bộ setup.** CI giúp fgOS ổn định +
   sẵn sàng ngay khi cài, giảm bớt việc phải tự dò các ràng buộc môi trường
   ngay tại máy người dùng — kiểm trước ở CI thay vì để người dùng tự đụng.
````

````diff

````
## source-decision claim_efbc056ae6dd5e3cc8e5b2fc74999f39

Decision:

````json
{
  "claimId": "claim_efbc056ae6dd5e3cc8e5b2fc74999f39",
  "sourceUnitDigest": "9dc7b4527c081f3c7f3ab0fce956e5b12456b8611380cb613451bfbbeee290de",
  "targetOwner": "docs/platform/packaging-distribution/history/distribution-vision.md",
  "targetAnchor": "3-đối-chiếu-với-quyết-định-đã-chốt-distributionmd",
  "targetUnitDigest": "9dc7b4527c081f3c7f3ab0fce956e5b12456b8611380cb613451bfbbeee290de",
  "targetAncestry": [
    "Cài đặt / Setup / Doctor của fgOS — tầm nhìn nền tảng"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/distribution-vision.md#3-đối-chiếu-với-quyết-định-đã-chốt-distributionmd to docs/platform/packaging-distribution/history/distribution-vision.md#3-đối-chiếu-với-quyết-định-đã-chốt-distributionmd. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/distribution-vision.md#3-đối-chiếu-với-quyết-định-đã-chốt-distributionmd`
Source unit SHA256: `9dc7b4527c081f3c7f3ab0fce956e5b12456b8611380cb613451bfbbeee290de`
Shown source SHA256: `da6e1bb60990d7eca29dc3e71fdc86f1d2be09e243ffc1a3791692c8426c7db3`

````text
## 3. Đối chiếu với quyết định đã chốt (distribution.md)

- **RUL11 (distribution.md) nói `fgos doctor --fix` chưa tồn tại, là
  "Deferred Idea có chủ đích", không phải gap.** Trụ cột 3 ở trên **đảo
  quyết định này** — chủ sản phẩm giờ muốn `doctor`/`setup` tự fix, không
  còn hoãn. Khi mảng này được thi công thật, RUL11 phải được sửa/supersede
  trong distribution.md (không sửa tại chỗ mà không ghi rõ lý do đảo).
- **Data Dictionary #7 (distribution.md)** liệt kê đúng 3 check cố định
  (`node-and-git`, `shell-integration-sourced`, `config-not-stale`) trong
  `src/setup/checks.mjs`. Trụ cột 4 đòi hỏi danh sách này trở thành
  **mở-rộng-được** (registry mà module khác tự thêm entry), không còn là
  literal 3 dòng cố định.
- **Trụ cột 6 (global vs project, không xung đột, project ghi đè global)**
  là khái niệm CHƯA có trong distribution.md lẫn coexistence.md hôm nay —
  cả hai tài liệu đó nói về "cài global hay project-local" (per install
  flags của người dùng, RUL không phân biệt hai cấp cùng tồn tại) và về
  "không giao thoa với harness KHÁC" (một công cụ điều phối khác, không phải
  hai bản fgOS). Đây là một khái niệm kiến trúc mới, chưa thiết kế.
- **Trụ cột 7 (CI như một phần của setup)** — repo hiện **chưa có
  `.github/workflows/`** nào; `test/install-packaging.test.mjs` là proof
  cục bộ duy nhất. CI thật (matrix OS/package-manager) là backlog mới.
- **Trụ cột 1 (không cần clone) và 2 (global/project)** phần lớn đã có sẵn
  qua `npm install -g github:vantt/forgent` (không đòi clone tay, install
  flags của người dùng tự chọn global/project) — coi như baseline đã đạt,
  chưa cần việc mới trừ khi có yêu cầu thêm đường cài khác (vd script cài
  một dòng, `npx`).
- **Context thứ 3 va chạm với global-install (xác nhận bằng đọc code thật,
  `scripts/fgos-shell-integration.sh:13-32`, 2026-08-01).** `_fgos_repo_root`
  resolve theo cwd MỖI LẦN GỌI qua `git rev-parse --git-common-dir`; `fgos`/
  `fgos-runner` là SHELL FUNCTION — function luôn thắng PATH binary cùng
  tên, không phân biệt cwd. Một contributor vừa source helper này (dev
  fgOS) vừa có `fgos` global-install (dùng cho project KHÁC, không phải
  forgent) trên cùng shell session: source helper **shadow chết global
  binary ở MỌI thư mục**; đứng trong project khác gõ `fgos`, root resolve ra
  được (project khác cũng là git repo) nhưng không có `bin/fgos.mjs` ở đó →
  lỗi Node xấu (`Cannot find module`), không phải lỗi rõ ràng như case
  "not a git repository" đã có (`test/scripts/fgos-shell-integration.test.mjs:38-94`
  chỉ phủ 2/3 case — case này chưa test, chưa xử lý). Đã loại trừ rủi ro sâu
  hơn (dev-HEAD code chạy nhầm lên data project khác, version/schema drift)
  — cơ chế chỉ resolve được khi root có `bin/fgos.mjs` thật (chỉ chính
  forgent hoặc clone/fork của nó), không bao giờ chạm data project khác dù
  đứng trong đó. Rủi ro thật CHỈ là shadow-and-break, không phải data
  corruption. Hướng fix kỹ thuật đề xuất (chưa quyết): function nên fallback
  `command fgos "$@"` (PATH binary thật) khi root resolve được nhưng KHÔNG
  có `bin/fgos.mjs` ở đó, thay vì lỗi xấu + shadow chết global install. Gộp
  vào scope `tsk-2ta` (không tách item riêng) — cùng trục "fgOS aware bao
  nhiêu context trên một máy".
````

Target: `docs/platform/packaging-distribution/history/distribution-vision.md#3-đối-chiếu-với-quyết-định-đã-chốt-distributionmd`
Target unit SHA256: `9dc7b4527c081f3c7f3ab0fce956e5b12456b8611380cb613451bfbbeee290de`
Shown target SHA256: `da6e1bb60990d7eca29dc3e71fdc86f1d2be09e243ffc1a3791692c8426c7db3`

````text
## 3. Đối chiếu với quyết định đã chốt (distribution.md)

- **RUL11 (distribution.md) nói `fgos doctor --fix` chưa tồn tại, là
  "Deferred Idea có chủ đích", không phải gap.** Trụ cột 3 ở trên **đảo
  quyết định này** — chủ sản phẩm giờ muốn `doctor`/`setup` tự fix, không
  còn hoãn. Khi mảng này được thi công thật, RUL11 phải được sửa/supersede
  trong distribution.md (không sửa tại chỗ mà không ghi rõ lý do đảo).
- **Data Dictionary #7 (distribution.md)** liệt kê đúng 3 check cố định
  (`node-and-git`, `shell-integration-sourced`, `config-not-stale`) trong
  `src/setup/checks.mjs`. Trụ cột 4 đòi hỏi danh sách này trở thành
  **mở-rộng-được** (registry mà module khác tự thêm entry), không còn là
  literal 3 dòng cố định.
- **Trụ cột 6 (global vs project, không xung đột, project ghi đè global)**
  là khái niệm CHƯA có trong distribution.md lẫn coexistence.md hôm nay —
  cả hai tài liệu đó nói về "cài global hay project-local" (per install
  flags của người dùng, RUL không phân biệt hai cấp cùng tồn tại) và về
  "không giao thoa với harness KHÁC" (một công cụ điều phối khác, không phải
  hai bản fgOS). Đây là một khái niệm kiến trúc mới, chưa thiết kế.
- **Trụ cột 7 (CI như một phần của setup)** — repo hiện **chưa có
  `.github/workflows/`** nào; `test/install-packaging.test.mjs` là proof
  cục bộ duy nhất. CI thật (matrix OS/package-manager) là backlog mới.
- **Trụ cột 1 (không cần clone) và 2 (global/project)** phần lớn đã có sẵn
  qua `npm install -g github:vantt/forgent` (không đòi clone tay, install
  flags của người dùng tự chọn global/project) — coi như baseline đã đạt,
  chưa cần việc mới trừ khi có yêu cầu thêm đường cài khác (vd script cài
  một dòng, `npx`).
- **Context thứ 3 va chạm với global-install (xác nhận bằng đọc code thật,
  `scripts/fgos-shell-integration.sh:13-32`, 2026-08-01).** `_fgos_repo_root`
  resolve theo cwd MỖI LẦN GỌI qua `git rev-parse --git-common-dir`; `fgos`/
  `fgos-runner` là SHELL FUNCTION — function luôn thắng PATH binary cùng
  tên, không phân biệt cwd. Một contributor vừa source helper này (dev
  fgOS) vừa có `fgos` global-install (dùng cho project KHÁC, không phải
  forgent) trên cùng shell session: source helper **shadow chết global
  binary ở MỌI thư mục**; đứng trong project khác gõ `fgos`, root resolve ra
  được (project khác cũng là git repo) nhưng không có `bin/fgos.mjs` ở đó →
  lỗi Node xấu (`Cannot find module`), không phải lỗi rõ ràng như case
  "not a git repository" đã có (`test/scripts/fgos-shell-integration.test.mjs:38-94`
  chỉ phủ 2/3 case — case này chưa test, chưa xử lý). Đã loại trừ rủi ro sâu
  hơn (dev-HEAD code chạy nhầm lên data project khác, version/schema drift)
  — cơ chế chỉ resolve được khi root có `bin/fgos.mjs` thật (chỉ chính
  forgent hoặc clone/fork của nó), không bao giờ chạm data project khác dù
  đứng trong đó. Rủi ro thật CHỈ là shadow-and-break, không phải data
  corruption. Hướng fix kỹ thuật đề xuất (chưa quyết): function nên fallback
  `command fgos "$@"` (PATH binary thật) khi root resolve được nhưng KHÔNG
  có `bin/fgos.mjs` ở đó, thay vì lỗi xấu + shadow chết global install. Gộp
  vào scope `tsk-2ta` (không tách item riêng) — cùng trục "fgOS aware bao
  nhiêu context trên một máy".
````

````diff

````
## source-decision claim_3c6f625013597dea9c2f79660f49da77

Decision:

````json
{
  "claimId": "claim_3c6f625013597dea9c2f79660f49da77",
  "sourceUnitDigest": "b61c78b133e8ae6f417d572a809493861d033ea6f3ae32ed57493f22399b9a19",
  "targetOwner": "docs/platform/packaging-distribution/history/distribution-vision.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "b61c78b133e8ae6f417d572a809493861d033ea6f3ae32ed57493f22399b9a19",
  "targetAncestry": [
    "Cài đặt / Setup / Doctor của fgOS — tầm nhìn nền tảng",
    "3. Đối chiếu với quyết định đã chốt (distribution.md)"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/distribution-vision.md#unheaded-block-6 to docs/platform/packaging-distribution/history/distribution-vision.md#unheaded-block-7. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/distribution-vision.md#unheaded-block-6`
Source unit SHA256: `b61c78b133e8ae6f417d572a809493861d033ea6f3ae32ed57493f22399b9a19`
Shown source SHA256: `b61c78b133e8ae6f417d572a809493861d033ea6f3ae32ed57493f22399b9a19`

````text
- **RUL11 (distribution.md) nói `fgos doctor --fix` chưa tồn tại, là
  "Deferred Idea có chủ đích", không phải gap.** Trụ cột 3 ở trên **đảo
  quyết định này** — chủ sản phẩm giờ muốn `doctor`/`setup` tự fix, không
  còn hoãn. Khi mảng này được thi công thật, RUL11 phải được sửa/supersede
  trong distribution.md (không sửa tại chỗ mà không ghi rõ lý do đảo).
- **Data Dictionary #7 (distribution.md)** liệt kê đúng 3 check cố định
  (`node-and-git`, `shell-integration-sourced`, `config-not-stale`) trong
  `src/setup/checks.mjs`. Trụ cột 4 đòi hỏi danh sách này trở thành
  **mở-rộng-được** (registry mà module khác tự thêm entry), không còn là
  literal 3 dòng cố định.
- **Trụ cột 6 (global vs project, không xung đột, project ghi đè global)**
  là khái niệm CHƯA có trong distribution.md lẫn coexistence.md hôm nay —
  cả hai tài liệu đó nói về "cài global hay project-local" (per install
  flags của người dùng, RUL không phân biệt hai cấp cùng tồn tại) và về
  "không giao thoa với harness KHÁC" (một công cụ điều phối khác, không phải
  hai bản fgOS). Đây là một khái niệm kiến trúc mới, chưa thiết kế.
- **Trụ cột 7 (CI như một phần của setup)** — repo hiện **chưa có
  `.github/workflows/`** nào; `test/install-packaging.test.mjs` là proof
  cục bộ duy nhất. CI thật (matrix OS/package-manager) là backlog mới.
- **Trụ cột 1 (không cần clone) và 2 (global/project)** phần lớn đã có sẵn
  qua `npm install -g github:vantt/forgent` (không đòi clone tay, install
  flags của người dùng tự chọn global/project) — coi như baseline đã đạt,
  chưa cần việc mới trừ khi có yêu cầu thêm đường cài khác (vd script cài
  một dòng, `npx`).
- **Context thứ 3 va chạm với global-install (xác nhận bằng đọc code thật,
  `scripts/fgos-shell-integration.sh:13-32`, 2026-08-01).** `_fgos_repo_root`
  resolve theo cwd MỖI LẦN GỌI qua `git rev-parse --git-common-dir`; `fgos`/
  `fgos-runner` là SHELL FUNCTION — function luôn thắng PATH binary cùng
  tên, không phân biệt cwd. Một contributor vừa source helper này (dev
  fgOS) vừa có `fgos` global-install (dùng cho project KHÁC, không phải
  forgent) trên cùng shell session: source helper **shadow chết global
  binary ở MỌI thư mục**; đứng trong project khác gõ `fgos`, root resolve ra
  được (project khác cũng là git repo) nhưng không có `bin/fgos.mjs` ở đó →
  lỗi Node xấu (`Cannot find module`), không phải lỗi rõ ràng như case
  "not a git repository" đã có (`test/scripts/fgos-shell-integration.test.mjs:38-94`
  chỉ phủ 2/3 case — case này chưa test, chưa xử lý). Đã loại trừ rủi ro sâu
  hơn (dev-HEAD code chạy nhầm lên data project khác, version/schema drift)
  — cơ chế chỉ resolve được khi root có `bin/fgos.mjs` thật (chỉ chính
  forgent hoặc clone/fork của nó), không bao giờ chạm data project khác dù
  đứng trong đó. Rủi ro thật CHỈ là shadow-and-break, không phải data
  corruption. Hướng fix kỹ thuật đề xuất (chưa quyết): function nên fallback
  `command fgos "$@"` (PATH binary thật) khi root resolve được nhưng KHÔNG
  có `bin/fgos.mjs` ở đó, thay vì lỗi xấu + shadow chết global install. Gộp
  vào scope `tsk-2ta` (không tách item riêng) — cùng trục "fgOS aware bao
  nhiêu context trên một máy".
````

Target: `docs/platform/packaging-distribution/history/distribution-vision.md#unheaded-block-7`
Target unit SHA256: `b61c78b133e8ae6f417d572a809493861d033ea6f3ae32ed57493f22399b9a19`
Shown target SHA256: `b61c78b133e8ae6f417d572a809493861d033ea6f3ae32ed57493f22399b9a19`

````text
- **RUL11 (distribution.md) nói `fgos doctor --fix` chưa tồn tại, là
  "Deferred Idea có chủ đích", không phải gap.** Trụ cột 3 ở trên **đảo
  quyết định này** — chủ sản phẩm giờ muốn `doctor`/`setup` tự fix, không
  còn hoãn. Khi mảng này được thi công thật, RUL11 phải được sửa/supersede
  trong distribution.md (không sửa tại chỗ mà không ghi rõ lý do đảo).
- **Data Dictionary #7 (distribution.md)** liệt kê đúng 3 check cố định
  (`node-and-git`, `shell-integration-sourced`, `config-not-stale`) trong
  `src/setup/checks.mjs`. Trụ cột 4 đòi hỏi danh sách này trở thành
  **mở-rộng-được** (registry mà module khác tự thêm entry), không còn là
  literal 3 dòng cố định.
- **Trụ cột 6 (global vs project, không xung đột, project ghi đè global)**
  là khái niệm CHƯA có trong distribution.md lẫn coexistence.md hôm nay —
  cả hai tài liệu đó nói về "cài global hay project-local" (per install
  flags của người dùng, RUL không phân biệt hai cấp cùng tồn tại) và về
  "không giao thoa với harness KHÁC" (một công cụ điều phối khác, không phải
  hai bản fgOS). Đây là một khái niệm kiến trúc mới, chưa thiết kế.
- **Trụ cột 7 (CI như một phần của setup)** — repo hiện **chưa có
  `.github/workflows/`** nào; `test/install-packaging.test.mjs` là proof
  cục bộ duy nhất. CI thật (matrix OS/package-manager) là backlog mới.
- **Trụ cột 1 (không cần clone) và 2 (global/project)** phần lớn đã có sẵn
  qua `npm install -g github:vantt/forgent` (không đòi clone tay, install
  flags của người dùng tự chọn global/project) — coi như baseline đã đạt,
  chưa cần việc mới trừ khi có yêu cầu thêm đường cài khác (vd script cài
  một dòng, `npx`).
- **Context thứ 3 va chạm với global-install (xác nhận bằng đọc code thật,
  `scripts/fgos-shell-integration.sh:13-32`, 2026-08-01).** `_fgos_repo_root`
  resolve theo cwd MỖI LẦN GỌI qua `git rev-parse --git-common-dir`; `fgos`/
  `fgos-runner` là SHELL FUNCTION — function luôn thắng PATH binary cùng
  tên, không phân biệt cwd. Một contributor vừa source helper này (dev
  fgOS) vừa có `fgos` global-install (dùng cho project KHÁC, không phải
  forgent) trên cùng shell session: source helper **shadow chết global
  binary ở MỌI thư mục**; đứng trong project khác gõ `fgos`, root resolve ra
  được (project khác cũng là git repo) nhưng không có `bin/fgos.mjs` ở đó →
  lỗi Node xấu (`Cannot find module`), không phải lỗi rõ ràng như case
  "not a git repository" đã có (`test/scripts/fgos-shell-integration.test.mjs:38-94`
  chỉ phủ 2/3 case — case này chưa test, chưa xử lý). Đã loại trừ rủi ro sâu
  hơn (dev-HEAD code chạy nhầm lên data project khác, version/schema drift)
  — cơ chế chỉ resolve được khi root có `bin/fgos.mjs` thật (chỉ chính
  forgent hoặc clone/fork của nó), không bao giờ chạm data project khác dù
  đứng trong đó. Rủi ro thật CHỈ là shadow-and-break, không phải data
  corruption. Hướng fix kỹ thuật đề xuất (chưa quyết): function nên fallback
  `command fgos "$@"` (PATH binary thật) khi root resolve được nhưng KHÔNG
  có `bin/fgos.mjs` ở đó, thay vì lỗi xấu + shadow chết global install. Gộp
  vào scope `tsk-2ta` (không tách item riêng) — cùng trục "fgOS aware bao
  nhiêu context trên một máy".
````

````diff

````
