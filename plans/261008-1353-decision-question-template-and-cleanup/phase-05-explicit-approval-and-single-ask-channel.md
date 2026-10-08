# Phase 05 — Chỉ đồng ý rõ ràng mới nhả gate; một kênh duy nhất cho câu hỏi

`fgos ask`/`fgos answer` vẫn giữ (owner: "không bỏ, chỉ là chưa quay lại").

## D2b — đồng ý rõ ràng

- Hiện tại: gate rủi ro và gate blast-radius nhả khi `gate.answer.trim()` không rỗng và `gate.ask` chứa chuỗi lý do (`src/intake/plan.mjs:711-713, 731-732`). "chưa hiểu, giải thích lại" cũng nhả.
- Sau: `fgos answer <id> --approve [text]` ghi `approved: true` vào sự kiện trả lời. Gate chỉ nhả khi câu trả lời gần nhất của chính gate đó có `approved: true`. Trả lời không có `--approve` = lời nhắn làm rõ: item quay lại hàng đợi, lần chạy sau park lại câu hỏi kèm lời nhắn.
- Đọc lại event cũ: câu trả lời cũ không có trường `approved` được coi là chưa đồng ý (một người dùng, không cần tương thích ngược; item đang treo sẽ hỏi lại một lần).
- Cập nhật skill `/fgOS:answer` (nguồn trong `core/`/`plugins` theo `build:skills`) để nói rõ khi nào dùng `--approve`.

## D3b — bỏ kênh song song

- Xoá `--rationale`/`--alternatives` của `fgos ask` (`bin/fgos.mjs:1759-1768`) và trường `askRationale`/`askAlternatives` trong `src/state/store.mjs:1372-1397`, `src/state/replay.mjs:308-319`, `src/state/awaiting-context.mjs:79-91`. Lựa chọn và lý do nằm trong thân câu hỏi theo mẫu.
- Event cũ có các trường này vẫn đọc được: replay bỏ qua trường lạ (xác minh), không cần di trú.
- Xoá/sửa 3 file test đang dùng các trường này.

## Việc cần làm

1. `bin/fgos.mjs`: thêm `--approve` cho `answer`; bỏ hai cờ của `ask`.
2. `src/state/*`: ghi/đọc `approved`; bỏ `askRationale`/`askAlternatives`.
3. `src/intake/plan.mjs`: hai điều kiện nhả gate dùng `approved`.
4. Test: 1 case "trả lời không --approve không nhả gate", 1 case "có --approve thì nhả"; sửa test cũ của gate và 3 file test của hai trường bị xoá.
5. Skill `/fgOS:answer`; CHANGELOG 1 dòng.

## Kiểm chứng

- Test hẹp: `test/intake/plan.test.mjs`, test của `answer`/awaiting, `test/state/*` liên quan; rồi `npm test`.
- `git grep -n -E "askRationale|askAlternatives|--rationale|--alternatives" -- src bin test` ra 0 (trừ đọc event cũ nếu cần).

## Rủi ro

- Item đang treo với câu trả lời cũ phải hỏi lại một lần: chấp nhận được (một người dùng).
- Agent tự chạy `fgos answer --approve` thay owner: `answer` đã giới hạn ai được trả lời theo role hiện có (xác minh); không thêm cơ chế mới trong plan này.
