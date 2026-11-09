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
