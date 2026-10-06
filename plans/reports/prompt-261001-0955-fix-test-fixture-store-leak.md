# Prompt: sửa test rò vào store `.fgos` thật (bản cập nhật 2026-10-01)

Dán phần dưới dòng `---` cho agent thực thi. Working directory: `/home/vantt/projects/forgentX`.

---

## Nhiệm vụ

Đọc và làm **đúng toàn bộ** prompt gốc: `plans/260930-0335-measure-runresult-classification-impact/fix-test-fixture-leak-prompt.md` (tìm mọi test rò, sửa tận gốc ở test, thêm hàng rào trong `scripts/run-tests.mjs`, backup rồi dọn rác **sau khi anh xác nhận danh sách**). Prompt gốc chưa được ai thực hiện.

Bên dưới là phần **cập nhật** so với prompt gốc. Chỗ nào mâu thuẫn, phần cập nhật thắng.

## Cập nhật số liệu (2026-10-01, cần tự kiểm lại)

- `.fgos/coordination/sessions/`: 606 thư mục, 602 có `session.json`; 512 `active`, 27 `completed`, 57 `partial`.
  - Khoảng **348** thư mục có id fixture `coord_*` / `policy-test*` (mới nhất 2026-09-20).
  - Thêm một nhóm prompt gốc **chưa nêu**: khoảng **115** session có `definitionRef.id` dạng `test.*` (`test.coordination-protocol.driver-authorized-recheck`, `…visibility-window`, `…specialist-binding`, `…recheck-disposition`) hoặc `some-def`, tạo ngày 2026-09-04 (114) và 2026-09-19 (9). Hai nhóm có thể chồng nhau — lập danh sách theo **cả** id thư mục **và** `definitionRef.id`.
- `.fgos/dispatch-runs/depth-test-exec/`: 120 run giả; còn `no-such-exec/`, `some-exec/`.
- Bằng chứng tổng hợp: `plans/reports/synthesis-260930-1229-request-to-run-brainstorm.md` §2 F13.

## Cập nhật yêu cầu

1. **Không đóng hay xoá session thật đang treo `active`.** Session thật (master loop, consult, research fan-out, architecture panel… không phải fixture) là **bằng chứng nền** cho đo lường của track request-to-run (tỉ lệ lần chạy tới trạng thái cuối). Chỉ xử lý dữ liệu do test sinh ra.
2. **Làm trong worktree riêng** từ `main`; symlink `node_modules` và `target` ngay sau `git worktree add`. Hàng rào snapshot `.fgos/` phải chạy trên **`.fgos` của worktree đang chạy test**, không phải checkout chính — checkout chính có session khác (agent đang làm plan tier, owner) ghi `.fgos` liên tục, snapshot ở đó sẽ báo sai.
3. Bước dọn rác (backup → danh sách → hỏi anh → xoá) thì thao tác trên **`.fgos` của checkout chính** `/home/vantt/projects/forgentX`, chỉ đụng đúng các thư mục trong danh sách đã được duyệt. Backup trước (`tar` vào `.fgos/backups/test-leak-261001/`).
4. **Giữ diff test nhỏ và cục bộ** (chỉ phần setup: `mkdtemp`, `--dir`/`cwd` tường minh, dọn dẹp). Lý do: plan tier (`plan/260930-tier-rigor-consolidation`, đang chạy ở worktree `~/projects/forgentX-tier-rigor-p01`) cũng sửa nhiều file test dispatch/coordination; diff nhỏ thì merge dễ. Merge về `main` sớm ngay khi xanh.
5. Plan Observe trong prompt gốc nay **đã xong**; hàng rào vẫn phải bao `.fgos/observe/`.

## Bàn giao

Như prompt gốc, thêm:

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: 1–2 câu
Files + commit hash (trên main)
Bảng test → đường dẫn bị ghi → cơ chế
Số liệu store trước/sau dọn (sessions theo trạng thái; dispatch-runs)
Concerns: nếu có
```
