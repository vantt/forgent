# Phase 02 — Gỡ các chỗ nói trùng về cách hỏi owner

Sau Phase 01, mẫu ở `core/instructions/decision-question.md` là nơi duy nhất nói câu hỏi quyết định viết thế nào. Mọi chỗ khác chỉ giữ phần riêng của nó (khi nào hỏi, cơ chế park/answer, loại câu hỏi khác) và trỏ tới mẫu bằng một dòng. Chỉ sửa chữ; không thêm code. Kiểm kê ngày 2026-10-08 trên main.

## Kiểm kê và cách xử lý

| # | Chỗ | Đang nói gì | Xử lý |
|---|---|---|---|
| 1 | `domains/coding/skills/fgos-coding-discovering/SKILL.md:160-161` | Câu hỏi `fgos ask` phải có 2 heading Context/Why | Thay bằng 1 dòng trỏ tới mẫu; giữ phần cite `citation-format.md` |
| 2 | `domains/coding/skills/fgos-coding-exploring/SKILL.md:26-27` | Như trên | Như trên |
| 3 | `domains/coding/skills/fgos-coding-implement/SKILL.md:50-51` | Như trên | Như trên |
| 4 | `domains/coding/skills/fgos-coding-shaping/SKILL.md:36` | Như trên | Như trên |
| 5 | `domains/coding/skills/fgos-coding-validating/SKILL.md:25-26` | Như trên | Như trên |
| 6 | `core/skills/_shared/coordination-driver.md:74` | "Ask Human": khi nào hỏi + gom câu hỏi | Giữ "khi nào"; bỏ phần gom (đã ở AGENTS.md #2); thêm trỏ tới mẫu |
| 7 | `core/skills/fgos-run/SKILL.md:52-60` | Cơ chế gom câu hỏi ở human gate | Giữ cơ chế; thêm 1 dòng: mỗi câu hỏi theo mẫu |
| 8 | `AGENTS.md` ưu tiên #2 | Khi nào hỏi, gom thành bộ, quyết khi đã rõ | Giữ nguyên ý; thêm "theo mẫu câu hỏi quyết định". Mẫu không chép lại ý này mà trỏ ngược về đây |
| 9 | Memory `feedback_advisor_not_mechanical_worker.md`, `feedback_decide_when_option_clearly_wins.md` | Bản văn xuôi của cùng quy tắc | Rút còn lý do lịch sử + trỏ tới mẫu và AGENTS.md #2 |

Không gộp, vì nói việc khác:

- `domains/coding/skills/fgos-coding-exploring/SKILL.md:92-97` và `references/lock-decisions-and-write-context.md:8`: câu hỏi Socratic để khám phá quyết định sản phẩm, hỏi bằng văn xuôi mở. Đây là loại câu hỏi khác với câu hỏi chọn hướng; mẫu ghi rõ phạm vi để không đè lên.
- `core/skills/_shared/citation-format.md`: cách cite ID, không phải cách hỏi.
- `~/.claude/rules/CLAUDE.md` có luật tương tự nhưng thuộc ck, dự án của người khác; không sửa.

## Việc cần làm

1. Sửa 7 chỗ trong repo theo bảng (mục 1–8, trừ memory). `npm run build:skills` để render lại `.agents/skills` và `plugins/fgOS/skills`; không sửa tay bản render.
2. Sửa 2 memory (mục 9).
3. Kiểm: `git grep -n "Why this matters" -- core domains src test AGENTS.md` ra 0; `git grep -n "decision-question" -- core domains AGENTS.md` liệt kê đúng các chỗ trỏ tới mẫu.

## Kiểm chứng

- Test render skill/doctrine đang có (`npm test` phần docs/skills) xanh.
- Net dòng của phase ≤ 0 ngoài bản render.

## Rủi ro

- Bỏ nhầm phần riêng của một skill khi rút gọn: mỗi chỗ chỉ thay đúng câu nói về cấu trúc câu hỏi.
