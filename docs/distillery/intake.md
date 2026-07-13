# Intake Queue

Nguồn học mới chờ triage. Gặp gì hay — repo, paper, blog, docs — thả vào đây ngay, không cần đánh giá. Định kỳ triage: đáng học → tạo `sources/<name>.md` đúng `type` rồi xóa dòng ở đây; không đáng → xóa kèm ghi chú vào cột lý do trước khi xóa (hoặc chuyển thẳng vào porting-log dạng rejected nếu là feature cụ thể).

| Nguồn | Type (đoán) | URL | Ngày thêm | Vì sao đáng chú ý |
|---|---|---|---|---|
| symphony | git-repo | https://github.com/hoangnb24/symphony | 2026-07-13 | Tách từ repository-harness (E11, decision 0009) — mang theo isolated worktree runner, auto mode, PR automation, web board, impeccable skill; consumer đầu tiên của orchestration protocol v1. Các entry `moved-to-symphony` trong sources/repository-harness.md sẽ tiếp tục tiến hóa ở đây |
| learn-harness-engineering | living-doc | https://walkinglabs.github.io/learn-harness-engineering/en/ | 2026-07-13 | Course 12 bài về harness engineering — sample living-doc thật đầu tiên (user chỉ định); bee đã audit nó trong docs/09-harness-course-adoption.md → có sẵn bản đối chiếu để kiểm chất lượng extract của ta |
| beads | git-repo | https://github.com/steveyegge/beads | 2026-07-13 | Memory/task-graph cho coding agents (Steve Yegge, Go): dependency-aware `bd ready` (topo sort trả việc unblocked), hash ID chống collision cho multi-agent song song, "memory decay" compaction tiết kiệm context. Cùng pattern JSONL-truth + SQLite-cache với harness changesets (hội tụ độc lập — xem deep-dive 11/07 §11). Đúng mảng task-unit + orchestration forgent cần |
