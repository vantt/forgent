# Phase 02 — Dọn dẹp phần phình

Chỉ xoá hoặc di chuyển; không thêm code, script hay check mới. Mỗi mục chạy sau khi owner trả lời câu hỏi tương ứng. Số đo ngày 2026-10-08 trên main `206b8a87d`.

## Bộ câu hỏi D1–D5

### D1. Hai cây tài liệu agent-coordination

1. **Chuyện gì:** `docs/architect/agent-coordination` và `docs/platform/agent-coordination` mỗi cây 21 MB; 868/938 file giống hệt từng byte; 340 file `.log` nằm trong hai cây này.
2. **Nguyên nhân:** engine điều phối đã gỡ (`2180b4e72`, 02/10) nhưng tài liệu chưa gỡ; doc-unification định di chuyển chúng rồi bị đóng băng.
3. **Lựa chọn:**
   - (a) Xoá cây `docs/architect/agent-coordination` (bản sao), sửa 1 link trong `core/skills/fgos-panel/SKILL.md:37` sang cây platform. Lợi: −21 MB, rủi ro thấp. Hại: còn 1 cây của component đã gỡ. Giá: 1 commit xoá + 1 dòng.
   - (b) Xoá cả hai cây, giữ lại 3 playbook mà `fgos-architecture-panel` đang link (chuyển vào chỗ khác). Lợi: −42 MB. Hại: phải chọn chỗ mới cho 3 file, chạm phạm vi doc-unification. Giá: 1 commit xoá + di chuyển 3 file + sửa link.
   - (c) Không làm, để doc-unification xử lý. Hại: plan đó đang đóng băng.
4. **Khuyến nghị:** (a) ngay; (b) để lúc quyết số phận doc-unification.
5. **Phạm vi:** đồng ý (a) = được xoá đúng cây `docs/architect/agent-coordination` và sửa link đó. Không được động cây platform hay file khác của `docs/architect`.

### D2. File log đã commit trong plans

1. **Chuyện gì:** 439 file `.log` tracked, 30 MB tổng; ngoài 340 file thuộc D1 còn khoảng 99 file trong `plans/` và `archive/plans/` (ví dụ 4 log ~1 MB của single-door, 4 log ~1,1 MB trong archive).
2. **Nguyên nhân:** proof được tính là tiến độ; không có giới hạn kích thước bằng chứng.
3. **Lựa chọn:**
   - (a) Xoá mọi `*.log` trong `plans/` và `archive/plans/`; report đã có tóm tắt. Lợi: vài MB, dễ. Hại: mất log thô (vẫn còn trong lịch sử git). Giá: 1 commit xoá.
   - (b) Như (a) và thêm vào `.githooks/pre-commit` một dòng từ chối `*.log` > 200 KB dưới `plans/`/`docs/`. Lợi: không mọc lại. Hại: thêm một check (~10 dòng). Giá: ~10 dòng.
   - (c) Không làm.
4. **Khuyến nghị:** (b) — chỉ xoá mà không chặn thì sẽ mọc lại; check 10 dòng nằm trong hook đã có.
5. **Phạm vi:** đồng ý = xoá `*.log` dưới hai thư mục đó (+ 10 dòng hook nếu chọn b). Không xoá json/jsonl evidence (cần quyết riêng).

### D3. 880 dòng dispatch chưa commit trong worktree advisory

1. **Chuyện gì:** worktree `advisory-capability-completion` có +1.432/−344 src chưa commit, trong đó ~880 dòng ở dispatch/herdr/confinement mà Exclusions của plan advisory cấm.
2. **Nguyên nhân:** live gate bị chặn bởi môi trường; câu "làm tiếp phase 2" được hiểu là cho phép sửa tầng chặn.
3. **Lựa chọn:**
   - (a) Đóng băng src, tách 880 dòng thành work item riêng được review rồi land hoặc bỏ; advisory giữ ≤ ~250 dòng (khuyến nghị red-team). Giá: 1 item mới, không thêm code.
   - (b) Bỏ toàn bộ 880 dòng. Hại: mất các sửa có thể đúng (settlement ghi đè `findings`).
   - (c) Để advisory làm tiếp tới live gate. Hại: chính cơ chế phình đang bàn.
4. **Khuyến nghị:** (a).
5. **Phạm vi:** đồng ý = session advisory dừng sửa src, lập item tách. Plan này chỉ ghi quyết định; việc thực hiện thuộc session advisory.

### D4. Branch doc-unification (21.044 dòng tool, đóng băng)

1. **Chuyện gì:** branch `plan/260925-documentation-authority-unification` có 21.044 dòng scripts+test và registry ~50 MB; owner đóng băng 07/10.
2. **Nguyên nhân:** gate claim-level buộc phải xây tool.
3. **Lựa chọn:** (a) giữ branch đóng băng, không merge — main không nặng thêm; (b) xoá branch và worktree; (c) viết lại plan với gate làm tay được.
4. **Khuyến nghị:** (a) bây giờ; quyết (b)/(c) khi cần dọn docs thật.
5. **Phạm vi:** đồng ý (a) = không làm gì trên main; chỉ ghi quyết định vào plan doc-unification.

### D5. 26 agent worktree cũ trong `.claude/worktrees` (3,4 GB, ngoài git)

1. **Chuyện gì:** 26 thư mục `.claude/worktrees/agent-*`, 3,4 GB đĩa; tổng 35 git worktree.
2. **Nguyên nhân:** worktree của subagent không được dọn khi xong việc.
3. **Lựa chọn:** (a) xoá các worktree không có thay đổi chưa commit và branch đã merge hoặc bỏ, báo danh sách còn lại; (b) chờ cuối track (memory: dọn worktree gom một lần).
4. **Khuyến nghị:** (a) cho `.claude/worktrees/agent-*` (subagent tạm), không động worktree của plan đang chạy (advisory, doc-unification, convention…).
5. **Phạm vi:** đồng ý = chỉ `.claude/worktrees/agent-*` sạch; worktree có thay đổi chưa commit thì liệt kê, không xoá.

## Kiểm chứng

- Mỗi mục: `git diff --shortstat` âm; link checker/`npm test` xanh sau D1 (link skill).
- D5: `git worktree list` trước/sau, danh sách worktree giữ lại kèm lý do.

## Rủi ro

- D1: link khác trỏ vào cây architect ngoài skill — `git grep "architect/agent-coordination"` trước khi xoá; các tham chiếu trong `docs/history`, `.fgos/events`, CHANGELOG là lịch sử, để nguyên.
- D5: worktree đang được session khác dùng — kiểm tra thay đổi chưa commit và tiến trình đang chạy trước khi xoá.
