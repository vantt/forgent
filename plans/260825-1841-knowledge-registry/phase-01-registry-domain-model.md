# Phase 01 — Registry domain model + reducer + invariant

> Đọc file này + các link trong nó là đủ để làm. Không cần đọc lại toàn bộ
> `docs/history/compound-learn-artifact-registry/DISCUSSION.md` (1700+ dòng).

**Chặn bởi:** —
**Là cổng cho:** phase 04, 05
**Rủi ro:** heavy

## Context

- Thiết kế: `docs/history/compound-learn-artifact-registry/DISCUSSION.md` §7 mục **A1** (`#task-registry-domain-model`), §6.7 bảng bốn nhãn.
- D-ID phải tuân: **D-tsk28x-6** (event + verb, không phải JSON soạn tay),
  **D-tsk28x-14** (invariant cardinality), **D-tsk28x-15** (lifecycle hai tầng).
- Phase này **không** thêm verb CLI (đó là phase 05) và **không** move file nào.

## Requirements — đúng khi nào thì xong

1. Hai họ sự kiện tách bạch, fold được thành view:
   ```
   topic.register  topic.rename  topic.split  topic.merge  topic.retire
   doc.reserve     doc.register  doc.mark-rendered  doc.promote
   doc.supersede   doc.retire    doc.path-move
   ```
2. Record đầy đủ:
   ```
   topicId, purposeSlug, purposeTitle, entities[]
   lineage: splitFrom | mergedFrom | renamedFrom
   role, framework, mode
   docLifecycle: reserved | provisional | active | superseded | retired
   currentPath, aliases[], sourceCaptureIds[]
   ```
3. **Invariant `activeDoc(topicId, role) <= 1` cưỡng chế NGAY TẠI CỬA GHI**, không
   phải kiểm sau. Một `doc.register`/`doc.promote` làm xuất hiện active thứ hai
   cho cùng cặp phải **ném lỗi**, không phải cảnh báo.
4. Đường **duy nhất** để có nhiều active doc cùng `role` là `topic.split` — nó
   sinh topic mới, và mọi ngoại lệ **để lại lineage**.
5. `reserved` là trạng thái **có trước khi file tồn tại**. Nó không phải `draft`,
   không phải `provisional`. Thiếu nó thì gate ở phase 06 khoá chết writer.
6. Chữ `draft` **không xuất hiện** ở tầng tài liệu (D-tsk28x-15).

## Files

**Tạo:**
- `src/state/knowledge-registry.mjs` — reducer thuần (không I/O), export
  `foldKnowledgeEvents(rawEvents)` + các validator.
- `test/state/knowledge-registry.test.mjs`

**Sửa:**
- `src/state/replay.mjs` — thêm `case 'topic.*'` / `case 'doc.*'` vào switch fold
  (khuôn: các `case 'work.add'`, `case 'work.stage'` đang có).
- `src/state/store.mjs` — cửa ghi, dùng `withEventsLock` + `appendEventLocked`
  (`src/state/events.mjs`), giống `addWork`/`moveWork` đang làm.

## Implementation steps

1. Đọc `src/state/replay.mjs` để nắm khuôn fold hiện tại (switch trên
   `event.type`, tích luỹ vào view). Mirror đúng khuôn đó, **không** phát minh
   cơ chế mới.
2. Viết reducer thuần trong `knowledge-registry.mjs`: nhận `rawEvents`, trả
   `{ topics: {...}, docs: {...} }`. Thuần, không đọc đĩa — mirror
   `src/report/enduser-index.mjs` (thuần, không I/O) và `src/report/entropy.mjs`.
3. Viết validator `assertActiveDocCardinality(view, topicId, role)` — ném
   `StoreError('validation', ...)` khi vi phạm. Dùng đúng shape lỗi mà các parse
   CLI-facing khác trong `store.mjs` đang dùng.
4. Nối cửa ghi: mỗi mutation đi qua `withEventsLock` + `appendEventLocked`, và
   **kiểm invariant BÊN TRONG cùng một lock scope** với append — nếu không, hai
   tiến trình cùng `doc.register` sẽ cùng pass kiểm rồi cùng ghi.
5. `topic.split` phải ghi lineage `splitFrom` trên topic mới **và** đặt topic cũ
   sang `retired` trong cùng một lần ghi.

## Tests

- reducer: thứ tự event bất kỳ cho cùng một view (idempotency + order-independence
  ở mức fold).
- `activeDoc(topicId, role) <= 1`: `doc.register` thứ hai cho cùng cặp **ném lỗi**.
- `topic.split` giữ lineage, **không mất source** — mọi `sourceCaptureIds` của
  topic cũ xuất hiện đủ trên các topic mới.
- `doc.promote` từ `reserved` (chưa render) **bị từ chối** — chỉ `provisional` mới
  lên `active` được.
- lifecycle không nhận giá trị `draft`.
- **Race**: hai lần `doc.register` đồng thời cho cùng cặp — đúng một cái thắng.
  Khuôn có sẵn: `test/runner/write-queue.test.mjs` chứng minh serialize thật bằng
  marker enter/exit không xen kẽ.

## Risks & rollback

- **Rủi ro cao nhất: kiểm invariant ngoài lock scope.** Nó sẽ pass mọi test tuần
  tự rồi hỏng dưới song song — đúng lớp bug `events.jsonl` lost-update đã gặp
  thật (`docs/explanation/events-jsonl-lost-update-race-under-concurrent-session-writes.md`).
- Rollback: phase này chỉ thêm module + case mới trong switch fold; chưa verb,
  chưa dữ liệu thật. Revert commit là đủ, không có state nào phải dọn.
