# Phase 05 — Verb `fgos topic *` và `fgos doc *`

> Đọc file này + các link trong nó là đủ để làm. Không cần đọc lại toàn bộ
> `docs/history/compound-learn-artifact-registry/DISCUSSION.md` (1700+ dòng).

**Chặn bởi:** phase 01
**Là cổng cho:** phase 06
**Rủi ro:** heavy

## Context

- Thiết kế: `docs/history/compound-learn-artifact-registry/DISCUSSION.md` §7 mục **A3** (`#task-registry-verbs`), mục Vocabulary.
- D-ID: **D-tsk28x-6** (không cho soạn JSON tay), **D-tsk28x-14** (cardinality),
  **D-tsk28x-17** (5 precondition của `promote`), **D-tsk28x-16** (đặt tên).
- **Không lồng ba cấp**: `fgos topic register`, KHÔNG phải
  `fgos knowledge topic register`. `topic`/`doc` là namespace **anh em** của
  `knowledge` — registry là *state*, đường ống là *process*.

## Requirements — đúng khi nào thì xong

1. Ba mặt CLI, hai cấp:
   ```
   fgos topic register|split|merge|rename|retire
   fgos doc   reserve|register|mark-rendered|move-path|promote|supersede|retire
   ```
2. **`fgos doc promote` là cửa DUY NHẤT lên `active`**, và phải khoá **đủ năm**
   precondition **ngay trong verb** (D-tsk28x-17):
   ```
   1. chỉ provisional -> active
   2. từ chối nếu ĐÃ CÓ active doc cùng (topicId, role)
   3. từ chối nếu currentPath không tồn tại ở HEAD
   4. từ chối alias path
   5. topic + role phải valid
   ```
3. `promote` **chỉ đổi registry state, không viết prose**.
4. `topic split` là **cửa duy nhất** tạo nhiều active doc cùng role (vì nó sinh
   topic mới). **Writer không có option "new doc id".**
5. Mọi verb ghi phải khai `--relation`-style rõ ràng? **Không** — đó là luật của
   `fgos decision`. Ở đây luật là: mọi mutation để lại lineage khi có.
6. Thêm verb `fgos knowledge status` (read-only) làm **neo khái niệm**: liệt kê
   trạng thái cả hệ (topic, doc, pending, drift) để người dùng thấy ba mặt kia
   thuộc về nhau.

## Files

**Sửa:**
- `src/cli/command-registry.mjs` — thêm entry cho từng verb (khuôn: các entry
  hiện có, đủ `{name, invoke, description, parameters, examples, access, deprecated}`).
- `bin/fgos.mjs` — case xử lý.

**Tạo:**
- `test/cli/knowledge-verbs.test.mjs`

⚠️ `bin/fgos.mjs` bị **phase 05, 06, 07** cùng chạm — không chạy song song.

## Implementation steps

1. Đọc 2-3 entry hiện có trong `COMMAND_REGISTRY` để mirror shape chính xác
   (`access: 'read'|'mutation'`, `requiresExistingStore`, `externalEffect`…).
2. Mọi verb mutation đi qua cửa ghi của phase 01 — **không** tự append event.
3. `doc promote`: implement đủ 5 precondition. Mỗi lời từ chối phải **nêu cách
   sửa** (khuôn: `docs/explanation/fsm-refusal-messages-name-a-remedy...`) —
   ví dụ precondition 4 phải nói "đây là alias của `<currentPath>`; dùng path đó".
4. `fgos knowledge status`: read-only, in bảng gọn + `--json` theo CTR001 envelope.
5. Cập nhật `test/cli/fgos-manifest.test.mjs` nếu nó đếm số verb.

## Tests

- `topic register` tạo topic.
- `topic split` retire topic cũ, tạo topic mới, **giữ lineage**.
- `doc register` **từ chối** active duplicate cùng `(topicId, role)`.
- `doc move-path` thêm alias và đổi `currentPath`.
- `doc promote` đổi `provisional → active`.
- **Không command nào** tạo extra doc cùng role nếu không split topic.
- `doc promote` — đủ 6 ca: không phải provisional / đã có active / currentPath
  vắng ở HEAD / alias path / topic-role invalid / **chỉ đổi state không viết prose**.
- mọi thông điệp từ chối chứa một hành động sửa được.

## Risks & rollback

- **Precondition 3 (`currentPath` tồn tại ở HEAD`)** phải đọc git HEAD, không phải
  working tree — khuôn có sẵn ở `fgos compound` (retrospective-doc-write-path D3).
  Đọc working tree sẽ cho pass một file chưa commit.
- Rollback: verb mới, chưa ai gọi trong luồng thật cho tới phase 06/09.
