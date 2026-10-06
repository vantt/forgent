# Nghiệm thu Ca 2 — architecture-advisory (chạy thật)

Date: 2026-10-02 · Plan: [plan.md](../plan.md) · Workflow: `core/workflows/architecture-advisory.yaml`
Status: **DONE_WITH_CONCERNS** — một Workflow run thật hoàn tất; so sánh trực tiếp với engine cũ là NOT RUN.

## 1. Run

Store `/home/vantt/projects/forgentX/.fgos`, transport thật: cli-spawn headless.
Lệnh: `fgos workflow start architecture-advisory --request "<Work giữ workflowStep lưu sẵn hay suy ra từ Workflow run?>" --dir <main>`.
`workflowRunId` = `wf-run-1790920977728-bd56da8d`, `events.jsonl` 22 dòng, 06:02:57 → 06:11:17 UTC (**8 phút 20 giây**), `completed/pass`.

| Bước | Vai → executor (outcome) |
|---|---|
| framing | producer claude (pass) |
| shaping (panel) | panelist-1 claude, panelist-2 **gemini**, panelist-3 **xai**, synthesizer claude (đều pass) |
| critique (reviewed) | producer claude, reviewer **gemini** (pass) |
| synthesis | producer claude (pass) |
| explanation | producer claude (pass) |

9 assignment, 3 họ provider khác nhau trong panel. Lead-active: 1 lệnh start.

Các run trước, không tính: `wf-run-1790920465286-8f0c47a7` (completed nhưng cả 3 panelist + synthesizer đều claude — ép độc lập chưa có), `wf-run-1790920922676-6d40bf8a` (failed `read-only-mutation`: chính em sửa file trong worktree đang chạy; chạy Workflow phải dùng worktree sạch riêng).

## 2. So với engine cũ

Chạy lại engine cũ cùng câu hỏi: **NOT RUN** (cần Lead lái tay mỗi bước `operation-authorized`). Số đo từ 11 session `architecture-advisory-panel*` lưu trong `.fgos/backups/coordination-sessions-backup.tar.gz` (đếm từ `events.jsonl`):

| | Engine cũ (11 session lịch sử) | Workflow mới (1 run) |
|---|---|---|
| Actor/vai | 4–8 actor bound | 9 assignment, 3 họ provider trong panel |
| Assignment | 3–20 (đa số 10–13) | 9 |
| Bước Lead phải ra lệnh | 3–13 `operation-authorized` + disposition | 1 (`start`) |
| Thời gian | 15 phút – 7 giờ (run-2: 2h30; runtime-recovery: ~7h40) | 8 phút 20 giây |

Hai cột đo bằng hai nguồn khác nhau (session thật của người dùng vs một run thử); không phải thí nghiệm đối chứng cùng câu hỏi.

## 3. Concerns

- Chất lượng nội dung đề xuất chưa được so với engine cũ; chỉ chứng minh luồng chạy hết và ép độc lập hoạt động.
- Synthesizer chạy lại họ claude (không ràng buộc độc lập với panelist).
