# Phase 07 — `doc-sources` / `docs-index` đọc qua resolver

> Đọc file này + các link trong nó là đủ để làm. Không cần đọc lại toàn bộ
> `docs/history/compound-learn-artifact-registry/DISCUSSION.md` (1700+ dòng).

**Chặn bởi:** phase 02
**Là cổng cho:** **phase 11** (chốt chặn cứng)
**Rủi ro:** heavy

## Context

- Thiết kế: `docs/history/compound-learn-artifact-registry/DISCUSSION.md` §7 mục **A2** phần consumer; §6.7 **Q8**.
- D-ID: **D-tsk28x-9**.
- **Đây là chốt chặn cứng:** `findAllSourceCaptureIds` (`src/report/enduser-index.mjs`)
  khớp `docPath` **chính xác từng ký tự**. Dời một file trước khi phase này xong
  ⇒ gãy linkage cho **toàn bộ 268 capture**.

## Requirements — đúng khi nào thì xong

1. `findAllSourceCaptureIds` + `fgos doc-sources` + `fgos docs-index` đọc **qua
   resolver** (phase 02), không so khớp chuỗi thuần.
2. `fgos doc-sources <oldPath>` **vẫn trả capture** sau khi file đã dời.
3. `fgos doc-sources <currentPath>` gom **cả** capture cũ lẫn mới.
4. `fgos docs-index` hiển thị `currentPath` nhưng **giữ provenance** old paths —
   không null-hoá source khi alias tồn tại.
5. Không sửa event cũ. `outcome.docPath` giữ nguyên vĩnh viễn.

## Files

**Sửa:**
- `src/report/enduser-index.mjs` — `findSourceCaptureId`, `findAllSourceCaptureIds`,
  `buildEnduserIndex`.
- `bin/fgos.mjs` — verb `doc-sources`, `docs-index`.

**Sửa test có sẵn:**
- `test/report/enduser-index.test.mjs`

⚠️ `bin/fgos.mjs` — xung đột với phase 05, 06.

## Implementation steps

1. Giữ nguyên chữ ký public của `findAllSourceCaptureIds` nếu được — nó có caller
   khác. Thêm tham số resolver optional, fallback về hành vi cũ khi vắng.
2. Khi resolver trả **nhiều** doc cho một oldPath (sau split), gom **hợp** các
   capture, không lấy cái đầu.
3. `docs-index`: thêm trường provenance (`aliases`) vào entry, đừng bỏ đường dẫn cũ.
4. Chạy `fgos docs-index` trên corpus thật và so với bản hiện tại — khác biệt phải
   **chỉ là thêm provenance**, không mất entry nào.

## Tests

- `doc-sources <oldPath>` vẫn trả capture sau migration (dùng fixture có alias).
- `doc-sources <currentPath>` gom cả cũ lẫn mới.
- `docs-index` **không null-hoá** source khi alias tồn tại.
- oldPath của topic đã split → gom đủ capture từ mọi doc con.
- **Không giảm**: tổng số capture reachable trước/sau ≥ bằng nhau.

## Risks & rollback

- **Regression im lặng:** nếu resolver trả `null` cho path chưa có trong registry
  và code coi đó là "không có capture", mọi tài liệu chưa bootstrap sẽ mất nguồn.
  Fallback phải là **hành vi cũ**, không phải rỗng.
- Rollback: giữ nhánh cũ sau cờ, revert được nhanh.
