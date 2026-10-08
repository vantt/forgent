# Phase 05 — Chỉ đồng ý rõ ràng mới nhả gate; một kênh duy nhất cho câu hỏi

`fgos ask`/`fgos answer` vẫn giữ (owner: "không bỏ, chỉ là chưa quay lại").

## D2b — đồng ý rõ ràng

- Hiện tại: gate rủi ro và gate blast-radius nhả khi `gate.answer.trim()` không rỗng và `gate.ask` chứa chuỗi lý do (`src/intake/plan.mjs:711-713, 731-732`). "chưa hiểu, giải thích lại" cũng nhả.
- Sau: `fgos answer <id> --approve [text]` ghi `approved: true` vào sự kiện trả lời. Gate chỉ nhả khi câu trả lời gần nhất của chính gate đó có `approved: true`. Trả lời không có `--approve` = lời nhắn làm rõ: item quay lại hàng đợi, lần chạy sau park lại câu hỏi kèm lời nhắn.
- Đọc lại event cũ: câu trả lời cũ không có trường `approved` được coi là chưa đồng ý (một người dùng, không cần tương thích ngược; item đang treo sẽ hỏi lại một lần).
- Cập nhật skill `/fgOS:answer` (nguồn trong `core/`/`plugins` theo `build:skills`) để nói rõ khi nào dùng `--approve`.

## D3b — bỏ kênh song song

- Chỉ phía `ask` (V2a): xoá cờ `--rationale`/`--alternatives` của `fgos ask` (`bin/fgos.mjs:1759-1768`) và trường `askRationale`/`askAlternatives` trong `src/state/store.mjs`, `src/state/replay.mjs:308-319`, `src/state/awaiting-context.mjs:79-91`, `src/cli/command-registry.mjs`; sửa chữ trong khoảng 8 file skill nhắc tới chúng (`git grep -E "ask .*--rationale|askRationale"` trong `core/` và `domains/`). Lựa chọn và lý do nằm trong thân câu hỏi theo mẫu.
- **Giữ nguyên** `fgos answer --rationale/--alternatives` (lý do của owner) và `fgos decision --rationale/--alternatives`.
- Event cũ có các trường này vẫn đọc được: replay bỏ qua trường lạ (xác minh), không cần di trú.
- Sửa các test đang dùng phía `ask` (khoảng 6–8 file, chủ yếu xoá dòng).

## Việc cần làm

1. `bin/fgos.mjs`: thêm `--approve` cho `answer`; bỏ hai cờ của `ask`.
2. `src/state/*`: ghi/đọc `approved`; bỏ `askRationale`/`askAlternatives`.
3. `src/intake/plan.mjs`: hai điều kiện nhả gate dùng `approved`.
4. Test: 1 case "trả lời không --approve không nhả gate", 1 case "có --approve thì nhả"; sửa test cũ của gate và 3 file test của hai trường bị xoá.
5. Skill `/fgOS:answer` (`plugins/fgOS/skills/answer/SKILL.md`) và mẫu: nói rõ `--approve` là đồng ý; agent không `--approve` thay owner trừ khi owner đã cho phép rõ (V1a). CHANGELOG 1 dòng.

## Kiểm chứng

- Test hẹp: `test/intake/plan.test.mjs`, test của `answer`/awaiting, `test/state/*` liên quan; rồi `npm test`.
- `git grep -n -E "askRationale|askAlternatives" -- src bin test core domains` ra 0 (trừ đọc event cũ nếu cần); `answer`/`decision` vẫn nhận `--rationale`.

## Rủi ro

- Item đang treo với câu trả lời cũ phải hỏi lại một lần: chấp nhận được (một người dùng).
- Agent tự chạy `fgos answer --approve` thay owner: `answer` không kiểm ai gọi (`bin/fgos.mjs:1787` luôn `role: 'human'`). Chỉ chặn bằng chữ (V1a); vẫn tốt hơn hiện nay (chữ bất kỳ nhả gate).

## Kết quả (2026-10-08)

- `fgos answer --approve` ghi `approved: true`; replay chỉ giữ `approved` sau đúng câu trả lời có `--approve`, xoá khi có ask mới hoặc câu trả lời thường. Hai gate (heavy-risk, blast-radius) trong `src/intake/plan.mjs` chỉ nhả khi `gate.approved === true`. Registry lệnh và skill `/fgOS:answer` mô tả `--approve`, cấm agent tự thêm (V1a).
- Phía `ask`: bỏ `--rationale/--alternatives`, bỏ `askRationale/askAlternatives` ở store (moveWork, settleClaim, putInAwaiting), replay, awaiting-context. Giữ `askSource`, `answer --rationale/--alternatives`, `fgos decision`.
- Sai ước tính trong plan: 8 file skill nhắc `--rationale` đều là `fgos decision` → không phải sửa.
- Test intake/state/cli/direct/parity: 2450, 0 fail.
- Ngân sách cả plan: src thêm 277/300 (xoá 126). Test: thêm 345, xoá 192, tổng đổi 537 — vượt 530 bảy dòng nếu tính cả dòng xoá; trong trần nếu đo test theo cách D7 (chỉ dòng thêm). Báo owner.
- Còn mở (ngoài phạm vi): `fgos workflow answer` ở human gate của Workflow chưa phân biệt đồng ý với làm rõ.
