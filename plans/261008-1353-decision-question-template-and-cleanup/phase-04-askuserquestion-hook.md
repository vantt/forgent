# Phase 04 — Hook chặn `AskUserQuestion` thiếu mẫu

## Vì sao

Cửa câu hỏi chính tháng qua là `AskUserQuestion` (403 lần gọi trong 117/170 session từ 2026-09-08), không phải `fgos ask` (2 lần park tháng 9, 0 tháng 10). Ví dụ: "Câu 1: xử lý work.tier thế nào?", "Áp dụng 15 finding red-team vào plan thế nào?". Ở cửa này chỉ có văn xuôi, đã thất bại. Owner chọn (D5a, 2026-10-08): hook `PreToolUse` cho `AskUserQuestion`; không làm hook `Stop` cho câu hỏi viết thẳng trong chat; xem lại sau 2 tuần.

## Khuôn có sẵn

- `scripts/dispatch-decide-hook.mjs` (75 dòng): đọc JSON từ stdin, quyết định cho/chặn Agent/Task.
- `src/setup/claude-code-hooks.mjs:53-70` `installClaudeCodeHook`: thêm matcher `Agent|Task` vào `.claude/settings.json`; `claudeCodeHookWired` cho doctor.
- Test: `test/scripts/dispatch-decide-hook.test.mjs`, `test/setup/claude-code-hooks.test.mjs`, `test/setup/checks.test.mjs`.

## Hành vi

Hook nhận input `PreToolUse` (`tool_name`, `tool_input`, `transcript_path`):

1. Lấy văn bản xem xét = đoạn chữ assistant ngay trước lời gọi tool (đọc phần cuối `transcript_path`) + `tool_input.questions[].question` + mô tả các option.
2. Gọi đúng hàm `checkDecisionQuestion` của Phase 01 (cùng một cửa kiểm với validator `fgos ask`) với đủ 5 phần.
3. Đủ → cho qua. Thiếu → chặn, `reason` liệt kê phần thiếu và in mẫu 5 phần để agent viết lại.
4. Không đọc được transcript → vẫn kiểm `tool_input` (câu hỏi + mô tả option); thiếu mẫu vẫn chặn (V3a). JSON stdin hỏng hay tool khác → cho qua, không bao giờ làm treo session.

## Việc cần làm

1. `scripts/decision-question-hook.mjs` (≤ 60 dòng): chỉ đọc stdin + transcript rồi gọi `checkDecisionQuestion`; không tự so heading.
2. `installClaudeCodeHook`: thêm entry matcher `AskUserQuestion` cạnh `Agent|Task`; `claudeCodeHookWired` kiểm cả hai. Chạy installer trong worktree để cập nhật `.claude/settings.json` nếu file được track (xác minh trước).
3. Test (sửa file test có sẵn, không tạo file mới nếu được; nếu cần thì 1 file `test/scripts/decision-question-hook.test.mjs` theo khuôn hook dispatch): cho qua khi đủ 5 phần; chặn khi thiếu "Phạm vi"; khi transcript không đọc được thì vẫn kiểm `tool_input` (đủ → qua, thiếu → chặn).

## Kiểm chứng

- Test hẹp ở trên + `test/setup/*`; rồi `npm test`.
- **Bắt buộc** thử thật trong một session Claude Code của worktree để xác nhận trường `transcript_path` có trong input: gọi `AskUserQuestion` thiếu mẫu → bị chặn với lý do; đủ mẫu → qua.

## Rủi ro

- Viết heading cho có: hook chỉ chứng minh các phần tồn tại; giống validator.
- Câu hỏi chuyển sang viết thẳng trong chat để né: theo dõi 2 tuần, khi đó mới quyết hook `Stop`.
- Chỉ Claude Code có hook; runtime khác dựa vào mẫu trong skill.
- Hook chạy mỗi lần `AskUserQuestion`: đọc tối đa phần cuối transcript (giới hạn byte), không quét cả file.

## Kết quả (2026-10-08)

- `scripts/decision-question-hook.mjs` (~80 dòng) chỉ gom chữ (đoạn assistant của lượt hiện tại từ transcript + câu hỏi + mô tả option) rồi gọi `checkDecisionQuestion` — cùng một cửa kiểm với `fgos ask`.
- `installClaudeCodeHook` cài cả `Agent|Task` và `AskUserQuestion`; `claudeCodeHookWired` đòi cả hai; thông báo doctor và dòng `dispatch-decide-hook-wired` trong `docs/specs/distribution.md` cập nhật. `.claude/settings.json` của worktree đã có entry mới.
- Chạy thật: `claude -p` (haiku) trong worktree với hook `PreToolUse` ghi payload → payload có `transcript_path`, file tồn tại, cấu trúc entry (user str / assistant blocks / user tool_result) khớp cách hook đọc. Chưa chạy thật một `AskUserQuestion` qua hook (chế độ `-p` không hỏi người); test dùng transcript thật dạng JSONL.
- Sửa kèm: chú thích cho RUL11 trong mục 0036/0054 và mẫu (check-decision-citation-drift bắt; Phase 03 chỉ chạy test docs nên lọt).
- Test setup/scripts/docs: 1263 test, hết đỏ sau khi sửa chú thích.
- Ngân sách tới hết Phase 04: src thêm 235/300 (xoá 61); test 415/530.
