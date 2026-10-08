# Phase 01 — Mẫu câu hỏi quyết định thay quy tắc cũ

## Bối cảnh

- Validator hiện tại: [src/state/status-fsm.mjs:295-334](../../src/state/status-fsm.mjs) — khi chuyển sang `awaiting-human`, đòi `## Context` và `## Why this matters`, mỗi mục ≥ 20 ký tự (tsk-539, commit `9828447d9`).
- Bộ sinh câu hỏi có sẵn dùng cấu trúc cũ: [src/intake/plan.mjs:269-274, 555](../../src/intake/plan.mjs), [src/intake/discovery.mjs:459](../../src/intake/discovery.mjs).
- Khoảng 20 test file chứa fixture `## Why this matters` (`git grep -l "Why this matters" test`).
- Luật được render vào AGENTS.md qua `core/instructions/*.md` có frontmatter (`kind: law`), xem [core/instructions/platform-laws.md](../../core/instructions/platform-laws.md) và `src/setup/instruction-registry.mjs`. Xác minh cơ chế discovery trước khi thêm file.

## Mẫu (nội dung file mới `core/instructions/decision-question.md`)

Mọi câu hỏi gửi owner để chọn hướng — trong chat, `AskUserQuestion`, `fgos ask`, gate, review — có đủ 5 phần:

1. **Chuyện gì đang xảy ra** — 1–2 câu, ngôn ngữ thường.
2. **Nguyên nhân** — đã kiểm bằng gì. Chưa biết nguyên nhân thì chỉ được xin phép điều tra, chưa được hỏi chọn hướng.
3. **Các lựa chọn** (2–4) — mỗi cái: làm gì, lợi, hại, giá (dòng code ước tính, thời gian, tầng/đường dẫn bị đụng).
4. **Khuyến nghị** — chọn cái nào, vì sao.
5. **Phạm vi của câu trả lời** — đồng ý thì được làm gì, và không được làm gì.

Gate không đạt được trong phạm vi đã khai là một câu hỏi quyết định theo mẫu này; không sửa ngoài phạm vi để gỡ gate.

Phạm vi mẫu: câu hỏi chọn hướng. Câu hỏi Socratic khám phá ý định sản phẩm (fgos-coding-exploring) theo quy tắc riêng của nó. Khi nào hỏi và gom thành bộ: xem AGENTS.md ưu tiên #2 (không chép lại ở đây).

## Việc cần làm

1. Tạo `core/instructions/decision-question.md` (frontmatter `kind: law`, ≤ 30 dòng, nội dung như trên). Chạy bước render đang dùng cho instruction (`fgos setup`/build tương ứng — xác minh lệnh) để AGENTS.md có mục mới.
2. Sửa validator trong `status-fsm.mjs`: thay 2 heading bằng 5 heading `## Chuyện gì đang xảy ra`, `## Nguyên nhân`, `## Các lựa chọn`, `## Khuyến nghị`, `## Phạm vi của câu trả lời`, giữ quy tắc ≥ 20 ký tự mỗi mục. Không giữ đường cũ (một người dùng, không cần tương thích ngược).
3. Sửa 3 bộ sinh câu hỏi trong `src/intake/` sang 5 heading, nội dung thật (không điền chữ đệm cho đủ độ dài).
4. Đổi chuỗi fixture trong test có sẵn; không thêm test file mới. Thêm đúng 1 case vào test validator hiện có: thiếu `## Phạm vi của câu trả lời` thì bị từ chối.
5. CHANGELOG `[Unreleased]`: 1 dòng (người dùng `fgos ask` sẽ thấy lỗi mới).

Sửa skill, AGENTS.md và memory cho khỏi trùng: Phase 02.

## Kiểm chứng

- Hẹp: test validator + `test/intake/*` + `test/cli/fgos-intake*`.
- Rộng: `npm test` (unset `CLAUDE_CODE_SESSION_ID` nếu chạy trong agent session).
- `git grep -n "Why this matters" -- src test` ra 0 (skill sửa ở Phase 02).
- `git diff --numstat <base> -- src` ≤ 60 dòng đổi; mọi path nằm trong `paths` của plan.md.

## Rủi ro và rollback

- Câu hỏi đang park ở `awaiting-human` với cấu trúc cũ không bị ảnh hưởng (validator chỉ chạy lúc chuyển trạng thái).
- Agent điền heading rỗng cho qua validator: ngưỡng 20 ký tự chỉ chặn mức tối thiểu; chất lượng thật nằm ở mục 3 và 5, reviewer trả lại câu hỏi thiếu giá hoặc thiếu phạm vi.
- Rollback: revert commit của phase.
