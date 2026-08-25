# Phase 02 — Resolver `oldPath → currentPath`

> Đọc file này + các link trong nó là đủ để làm. Không cần đọc lại toàn bộ
> `docs/history/compound-learn-artifact-registry/DISCUSSION.md` (1700+ dòng).

**Chặn bởi:** phase 01
**Là cổng cho:** phase 07
**Rủi ro:** heavy

## Context

- Thiết kế: `docs/history/compound-learn-artifact-registry/DISCUSSION.md` §7 mục **A2** (`#task-docpath-alias-resolver`), §6.7 quy định **Q8**.
- D-ID phải tuân: **D-tsk28x-9** — `docPath` cũ là **sự thật lịch sử, không sửa
  event cũ**; "topic X hiện sống ở file nào" là **bản chiếu** do registry trả lời.
  Đây là áp thẳng **D-ADR0001** (nhật ký là sự thật, store là bản chiếu).
- Phase này **chỉ viết resolver**, chưa đổi consumer nào (đó là phase 07).

## Requirements — đúng khi nào thì xong

1. `resolveDocPath(view, path)` trả về:
   ```
   exact currentPath  -> doc
   alias oldPath      -> doc
   không khớp         -> null
   ```
2. Resolve đi qua **lineage** `split`/`merge`: một path cũ thuộc topic đã bị tách
   phải resolve ra được doc hiện tại, không trả `null`.
3. Thuần, không I/O — nhận view từ phase 01.
4. **Không** sửa bất kỳ event cũ nào. Không có đường nào ghi đè `docPath` lịch sử.

## Files

**Tạo:**
- `src/report/knowledge-resolver.mjs`
- `test/report/knowledge-resolver.test.mjs`

## Implementation steps

1. Đọc `src/report/enduser-index.mjs` — đặc biệt `findSourceCaptureId` và
   `findAllSourceCaptureIds`, để thấy chỗ hiện đang so khớp `docPath` **chính xác
   từng ký tự**. Đó là thứ phase 07 sẽ thay; phase này chuẩn bị hàm thay thế.
2. Viết `resolveDocPath` thuần. Ưu tiên: exact `currentPath` trước, rồi `aliases`.
3. Xử lý lineage: nếu path trỏ vào một doc thuộc topic đã `retired` do split, đi
   theo `splitFrom` xuôi chiều tới (các) doc hiện tại. Trả về **danh sách** khi
   một path cũ nay ứng với nhiều doc (hệ quả của split) — đừng ép về một.
4. Ghi rõ trong JSDoc: hàm này **không** đọc đĩa và **không** kiểm file tồn tại;
   việc đó thuộc gate ở phase 06.

## Tests

- exact currentPath → đúng doc.
- alias oldPath → đúng doc.
- path không có trong registry → `null` (không ném lỗi).
- path cũ của topic đã split → trả **đủ** các doc hiện tại, không mất cái nào.
- path cũ của topic đã merge → trả doc đích.
- chuỗi lineage nhiều bậc (split rồi merge) vẫn resolve được.

## Risks & rollback

- **Bẫy: trả về một doc khi lẽ ra là nhiều.** Sau split, một `oldPath` ứng với
  nhiều doc; ép về một sẽ âm thầm mất nguồn ở phase 07 và 11.
- Rollback: module mới, chưa ai gọi. Revert là đủ.
