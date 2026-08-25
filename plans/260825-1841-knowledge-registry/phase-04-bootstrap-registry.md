# Phase 04 — Bootstrap registry từ chính output của classifier

> Đọc file này + các link trong nó là đủ để làm. Không cần đọc lại toàn bộ
> `docs/history/compound-learn-artifact-registry/DISCUSSION.md` (1700+ dòng).

**Chặn bởi:** phase 01, **phase 03**
**Là cổng cho:** phase 06
**Rủi ro:** heavy

## Context

- Thiết kế: `docs/history/compound-learn-artifact-registry/DISCUSSION.md` §7 thứ tự **bước 4**, và **D-tsk28x-18**.
- **Cổng cứng #1:** phase 03 phải xong trước. Bootstrap phải gán
  `(topicId, role)` cho 268 tài liệu — mà việc gán đó *chính là* phân loại.
  Bootstrap không có classifier ⇒ 268 dòng registry **rỗng nghĩa** ⇒ invariant
  `activeDoc(topicId, role) <= 1` **vô hiệu** vì cả hai khoá đều rỗng.

## Requirements — đúng khi nào thì xong

1. Đọc file dữ liệu của phase 03, tạo registry entry cho **toàn bộ** corpus với
   `currentPath = oldPath` (chưa dời file nào).
2. **Idempotent, chạy lại được nhiều lần** — đây là một cuộc di trú metadata cho
   268 tài liệu, không phải một lệnh chạy một lần rồi thôi.
3. Không tạo entry nào có `topicId` hoặc `role` rỗng. Gặp dòng classifier thiếu
   ⇒ **dừng và báo**, không ghi bừa.
4. `docLifecycle` khởi tạo: tài liệu đang tồn tại và đã commit ⇒ `active`
   (chúng là hiện trạng đã được dùng), **không** phải `provisional`.
5. Sau khi chạy: `activeDoc(topicId, role) <= 1` đúng cho toàn corpus. Nếu
   classifier gán trùng cặp cho hai file ⇒ **báo lỗi kèm danh sách**, để người
   xử, không tự chọn bừa một cái.

## Files

**Tạo:**
- `scripts/knowledge-bootstrap.mjs`
- `test/state/knowledge-bootstrap.test.mjs`

## Implementation steps

1. Đọc output phase 03. Validate shape trước khi ghi bất cứ gì.
2. Kiểm trùng cặp `(purposeSlug, role)` **trước** khi append event nào — đây là
   lần đầu invariant #1 gặp dữ liệu thật, và nó sẽ bắt được các cụm trùng chủ đề
   (ví dụ đã biết: 3 file worktree-reclaim).
3. Ghi event `topic.register` + `doc.register` qua cửa ghi phase 01.
4. Idempotency: chạy lần hai không được đẻ event trùng. Cách rẻ nhất là so view
   hiện tại trước khi append, trong cùng lock scope.
5. In report: bao nhiêu topic, bao nhiêu doc, bao nhiêu cặp trùng phải xử tay.

## Tests

- chạy hai lần liên tiếp cho ra view **y hệt** (idempotent).
- classifier row thiếu `topicId`/`role` ⇒ dừng, không ghi entry nào.
- hai file cùng cặp `(purposeSlug, role)` ⇒ báo lỗi có tên cả hai file.
- sau bootstrap, mọi doc ở `active` và invariant #1 đúng toàn corpus.

## Risks & rollback

- **Rủi ro lớn nhất: ghi entry rỗng nghĩa.** Nếu chạy khi phase 03 chưa xong,
  registry đầy 268 dòng vô nghĩa và mọi phase sau đứng trên nền sai. Test phải có
  ca "input thiếu ⇒ từ chối chạy".
- Rollback: registry là event log — không xoá được event đã ghi. Nếu bootstrap
  sai, phải `topic.retire`/`doc.retire` rồi bootstrap lại, **hoặc** revert
  `.fgos/events.jsonl` về commit trước bằng git (nó là file committed).
  ⇒ **Chạy bootstrap trên nhánh riêng, commit event log ngay sau đó.**
