# Hướng dẫn cho máy owner: làm cứng Skill và Domain, T8

Hướng dẫn này cho máy owner và máy thứ ba (forgentX, fg-server). fg-server2 tự land từng phase của T8 (quyết định 79). Mỗi phase đã land có một mục bên dưới, xếp theo số phase. Plan: [`plans/261109-1304-harden-t8-skill-domain`](../261109-1304-harden-t8-skill-domain/plan.md).

## Lưu ý chung

- Không đổi schema `~/.fgos/config.json`; không cần kích hoạt đồng loạt mọi máy.
- Id release đang chạy trên fg-server2 trước T8 phase 06: `sha256:fabc22ddd83d75710e0bcd574fd78987465845c1b18784c5e7ec3ed1b7496ada`. Rollback = kích hoạt lại id này.
- Các mục dưới ghi commit sau khi land; mục nào chưa có commit thì phase chưa land.

## P06: dòng doctor `agent-claims-resolve` và `executor-skills-installed`

- **Commit trên main:** `9309685c0..688850394`.
- **Người dùng thấy gì:**
  - `fgos doctor` dòng `agent-claims-resolve` nghiêm hơn: một khai báo `requires-skill` của task-spec chỉ qua khi **cả hai** điều kiện đúng: có agent cung cấp skill đó **và** tên là skill fgOS sở hữu (nguồn trong `core/skills` hoặc `domains/<domain>/skills`). Thông báo nêu rõ phía nào hỏng.
  - Dòng `executor-skills-installed` nhận thư mục skill ở cấp người dùng (`~/.claude/skills`, `~/.agents/skills` cho Claude và Codex) ngoài cấp dự án. File `SKILL.md` rỗng bị từ chối. Thông báo nói rõ worktree chỉ có skill nhờ `worktreeSetup`, nên qua ở checkout chính chưa chắc qua trong worktree.
  - Ba tên cũ của skill đã đổi tên (`fgos-coding-compounding` thành `fgos-coding-knowledge`) trong task-spec `compound-learn` và hai agent (`docs-manager`, `fgos-placeholder`) được sửa; dòng doctor mới chính là thứ phát hiện ra chúng.
  - Số dòng doctor và id các dòng không đổi.
- **Lệnh trên từng workspace:** `git pull --rebase`; build, stage, kích hoạt release như thường lệ; `fgos doctor </dev/null`.
- **Doctor mong đợi:** không có dòng mới. Dự án nào có task-spec riêng khai `requires-skill` cho tên không phải skill fgOS sở hữu sẽ thấy `agent-claims-resolve` đỏ: sửa tên trong task-spec hoặc thêm skill.
- **Quay lại:** revert commit merge của phase; hai dòng doctor trở lại phán yếu hơn. Không có dữ liệu trên đĩa bị đổi.

## P10: worktree mới nhận mọi thư mục skill bị git bỏ qua của checkout chính

- **Commit trên main:** `4c40941a1..95ed05914` (mã `4c40941a1`, config `95ed05914`).
- **Người dùng thấy gì:**
  - Worktree mới tự nhận, dưới `.claude/skills`, `.agents/skills`, `.omp/skills`, `.pi/skills`, `.grok/skills`, mọi thư mục mà checkout chính đang git-ignore (bất kể bộ skill nào, không tên nào được ghi cứng). Skill của fgOS do git theo dõi nên không bị chép đè. Link không bị đi theo. Chạy lại không chép thêm. Chép thật, không hardlink (ghi vào file qua hardlink sẽ đổi file ở checkout chính).
  - Dòng `worktreeSetup` chép `ak-*` trong `.fgos/config.yaml` của repo này bị xoá. Mỗi worktree vẫn chép khoảng 90 MB, 8 800 file, đo được 1,6 giây (dòng cũ 3,7 đến 4,4 giây).
  - Chép lỗi thì việc tạo worktree dừng và báo tên thư mục skill (worktree thiếu skill là worktree hỏng); phần đã chép được thu hồi khi gỡ worktree.
- **Lệnh trên từng workspace:** máy có sửa cục bộ `.fgos/config.yaml` (máy owner, fg-server) kéo bằng `git pull --autostash` (hoặc `git stash`, `git pull`, `git stash pop`); không dùng `git reset`. Sau đó kiểm tra các dòng cục bộ của file vẫn còn.
- **Doctor mong đợi:** không có dòng mới.
- **Quay lại:** revert commit; worktree đã tạo giữ nguyên bản chép của nó.
