# Phase 11 — Migration — dry-run rồi apply/fold 268 tài liệu

> Đọc file này + các link trong nó là đủ để làm. Không cần đọc lại toàn bộ
> `docs/history/compound-learn-artifact-registry/DISCUSSION.md` (1700+ dòng).

**Chặn bởi:** phase 03, 07, **phase 10 phải XANH**
**Là cổng cho:** phase 12
**Rủi ro:** heavy

## Context

- Thiết kế: `docs/history/compound-learn-artifact-registry/DISCUSSION.md` §7 mục **A7 phần migration** (`#task-migration-dryrun`),
  §6.5 (kỷ luật conservation, bài học B6b).
- D-ID: **D-tsk28x-11** (conservation là guard bắt buộc), **D-tsk28x-9** (alias
  trước, dời sau), **D-tsk28x-5** (layout mới).
- **Ba tiền điều kiện, không được bỏ qua cái nào:** phase 03 (có bảng gán),
  phase 07 (oldPath vẫn resolve được), phase 10 (**canary xanh**).

## Requirements — đúng khi nào thì xong

**Dry-run — chưa move file nào:**

1. Inventory: `oldPath → {{topicId, role, entities, framework, mode, targetPath}}`.
2. **Conservation gate**:
   - mỗi old file xuất hiện **đúng một lần** — hoặc trong danh sách nguồn của một
     đích, hoặc trong danh sách loại trừ **có lý do ghi rõ**;
   - **không target nào nhận 0 source mà vẫn `active`**;
   - **không source nào bị fold mất lineage**.
3. Dry-run duplicate detector: chỉ ra near-duplicate / split / merge.
4. Output là **report**, chưa ghi docs chính thức.

**Apply — chỉ khi dry-run sạch:**

5. Commit registry + aliases **trước**.
6. Đổi resolver consumers (đã xong ở phase 07 — xác nhận lại).
7. Move/fold file theo **từng target**.
8. Rebuild index.
9. Chạy duplicate/lineage harness.
10. Promote docs cần official (**thủ công**, qua `fgos doc promote` — không tự động).

Song song **chỉ theo target topic/doc**, không theo source file tự do.

## Files

**Tạo:**
- `scripts/knowledge-migration.mjs` (dry-run + apply, hai chế độ)
- `test/scripts/knowledge-migration.test.mjs`

**Sửa (ở bước apply):**
- toàn bộ `docs/` tree — 268 file gộp về ~33 target.

## Implementation steps

1. Viết dry-run trước, chạy nó, **đọc report bằng mắt** trước khi viết apply.
2. Conservation implement theo đúng khuôn B6b (§6.5): *mọi mục phải được kể tên
   đúng một lần — trong danh sách, trong phần bị cắt, hoặc trong phần loại trừ;
   thiếu một cái là ném lỗi.*
3. Apply: mỗi target là một đơn vị. Ghi file mới, **giữ mọi chi tiết cũ** (R3:
   nuôi là bổ sung, không xoá/rút gọn/xáo lại), rồi `doc move-path` để đăng ký
   alias, rồi xoá file cũ.
4. **Không `git add -A`** trong worktree (AGENTS.md tsk-56u: `.fgos/` bị strip,
   `-A` stage nó thành deleted và huỷ event log khi merge).
5. Sau apply: chạy lại `fgos docs-index` và so tổng capture reachable trước/sau.

## Tests

- conservation test trên inventory: thiếu một file ⇒ **ném lỗi**.
- **regression "three worktree docs"**: ba file cùng chủ đề bị near-dupe detector
  gom/cảnh báo **kể cả khi proposed purpose khác nhau**. (Session tự đo ra cách
  cũ chỉ bắt 2/3 — test này ép giải nốt 1/3 còn lại.)
- dry-run snapshot **ổn định**: chạy hai lần cho cùng output.
- apply **không làm giảm** tổng source captures reachable.
- sau apply, `doc-sources <oldPath>` vẫn trả capture.

## Risks & rollback

- **Rủi ro cao nhất của cả kế hoạch.** 268 file bị viết lại. Bắt buộc:
  nhánh riêng, commit từng target, dry-run report lưu lại làm bằng chứng.
- **Fan-out từng đua worktree và phải lùi về tuần tự** (đã gặp thật). Nếu song
  song hoá thì pin worktree tử tế; nghi ngờ thì chạy tuần tự.
- Rollback: git revert theo từng target commit. **Đừng gộp 268 file vào một
  commit** — mất khả năng revert từng phần.
