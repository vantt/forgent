# Nghiệm thu P3 — Workflow tách khỏi Work (viết lại theo bằng chứng thật)

Date: 2026-10-02 (viết lại; bản trước ghi "Accepted" khi chưa có run nào trong store và P3b còn chép cứng đồ thị stage trong dispatch)
Plan: [plan.md](../plan.md)
Status: **DONE_WITH_CONCERNS** — smoke marketing chạy thật; P3b làm lại thật ở vòng sửa.

## 1. Smoke marketing (G4b) — chạy thật

Store `/home/vantt/projects/forgentX/.fgos/workflow-runs/`, worktree chạy `forgentX-r2r-run`, transport thật: **cli-spawn headless** (không qua herdr — xem concerns).

| Mục | Giá trị |
|---|---|
| Lệnh | `fgos workflow start marketing/content-publish --request "<yêu cầu viết note 120 từ>" --dir <main>` rồi `fgos workflow answer <id> --step approval --answer "Approved…"` |
| workflowRunId | `wf-run-1790920102773-e8eacc5b` (events: `.fgos/workflow-runs/wf-run-1790920102773-e8eacc5b/events.jsonl`, 18 events, 05:48:22 → 05:54:15 UTC ≈ 6 phút) |
| brief | solo, producer claude → pass |
| draft | reviewed, producer claude + reviewer **gemini** (họ khác) → pass |
| approval | `gate.park` thật, `status: parked`, câu hỏi "Approve publication of the marketing content?" → answer → tiếp tục |
| publish | solo, claude, ghi `content/published/fgos-run-launch.md` trong worktree unit (`wf/wf-run-1790920102773-e8eacc5b/publish-content`) → pass |
| Kết quả | `completed` / `pass`; sản phẩm: [evidence/marketing-smoke-published-note.md](evidence/marketing-smoke-published-note.md) (117 từ) |

Để chạy được phải thêm vào config runtime của store chính 13 capability (`marketing:*`, `architecture:*`, `business:*`, prefer claude/gemini/xai/deepseek); bản gốc lưu `.fgos/config.json.pre-acceptance-261002`. `fgos setup` hiện **không** cấp mặc định cho các capability này.

Các lần chạy trước (không tính là pass, giữ để truy vết): `wf-run-1790919194728-a48bc335` (không có executor cho `marketing:research` mà bước vẫn bị tính `pass` — lỗi, đã sửa), `wf-run-1790919429250…` (agent trả `blocked` vì workflow không nhận yêu cầu → thêm `--request`), `wf-run-1790919736917-57013e13` (completed nhưng reviewer cùng họ với producer → thêm ép độc lập).

## 2. P3b — bằng chứng

- Work không còn `stage`: `rg "\.stage\b" src/state` chỉ còn đường đọc dữ liệu cũ trong `replay.mjs` và câu báo lỗi trong `work.mjs` (`work.stage is retired`). Work ghi `workflowStep`; event `work.step` (đọc được `work.stage` cũ), view version 4, Rust `packages/work-state` đọc bản mới. Replay trên bản sao store thật: 301 item, 0 item còn `stage`.
- `src/state/workflow-stage-graphs.mjs`, `scripts/migrate-clarify-split.mjs` xoá; `stage-fsm`→`step-fsm`, verb `stage`→`step`.
- Dispatch nhận domain/operations/skill từ Workflow qua Assignment (`provenance.declared.legalOperations`), kiểm "operation hợp lệ" ở `executeAssignment`; không import `src/state/**`, không literal domain/step: guard trong `test/architecture.test.mjs`.
- Bước, phase, skill, operation, nước đi hợp lệ nằm trong `domains/*/workflows/*.yaml`; `src/state/domain-registry.mjs` đọc `domains/<d>/compiled.json` (sinh bằng `npm run build:domains`, có test lệch + doctor check).
- Full `npm test` Node: 6470 test, 0 fail; Rust workspace xanh.

## 3. Concerns

- herdr transport chưa nối dây trong `fgos run`/workflow (xem P1 acceptance §3).
- Tên operation (`validate-plan`…) vẫn còn trong `assignment-normalizer.mjs`/`assignment.mjs`; guard chỉ cấm tên domain/step.
- Trường `stage` của Assignment còn như nhãn mờ (dọn thuật ngữ thuộc P5).
- Unit worktree của workflow (`/tmp/fgos-wf-wt-*`) không được dọn sau khi chạy.
