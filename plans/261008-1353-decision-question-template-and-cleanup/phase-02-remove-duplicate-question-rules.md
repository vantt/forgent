# Phase 02 — Gỡ các chỗ nói trùng về cách hỏi owner

Sau Phase 01, mẫu ở `core/skills/_shared/decision-question.md` là nơi duy nhất nói câu hỏi quyết định viết thế nào. Mọi chỗ khác chỉ giữ phần riêng của nó (khi nào hỏi, cơ chế park/answer, loại câu hỏi khác) và trỏ tới mẫu bằng một dòng. Chỉ sửa chữ; không thêm code. Kiểm kê ngày 2026-10-08 trên main.

## Kiểm kê và cách xử lý

| # | Chỗ | Đang nói gì | Xử lý |
|---|---|---|---|
| 1 | `domains/coding/skills/fgos-coding-discovering/SKILL.md:160-161` | Câu hỏi `fgos ask` phải có 2 heading Context/Why | Thay bằng 1 dòng trỏ tới `../_shared/decision-question.md` kèm tên các heading bắt buộc; giữ cite `citation-format.md` |
| 2 | `domains/coding/skills/fgos-coding-exploring/SKILL.md:27-28` | Như trên | Như trên |
| 3 | `domains/coding/skills/fgos-coding-implement/SKILL.md:51-52` | Như trên | Như trên |
| 4 | `domains/coding/skills/fgos-coding-shaping/SKILL.md:36` | Như trên | Như trên |
| 5 | `domains/coding/skills/fgos-coding-validating/SKILL.md:26-27` | Như trên | Như trên |
| 5b | `domains/coding/skills/fgos-coding-shaping/SKILL.md:46-52, 250` | Cấm `AskUserQuestion` trong shaping | Giữ lệnh cấm (shaping là thảo luận mở); mẫu ghi rõ nó không áp cho shaping thay vì liệt kê `AskUserQuestion` chung chung |
| 6 | `core/skills/_shared/coordination-driver.md:74` | "Ask Human": khi nào hỏi + gom câu hỏi | Giữ "khi nào"; bỏ phần gom (đã ở AGENTS.md #2); thêm trỏ tới mẫu |
| 7 | `core/skills/fgos-run/SKILL.md:52-60` | Cơ chế gom câu hỏi ở human gate | Giữ cơ chế; thêm 1 dòng: mỗi câu hỏi theo mẫu |
| 8 | `AGENTS.md:19` ưu tiên #2 (phần viết tay, ngoài khối do writer quản lý) | Khi nào hỏi, gom thành bộ, quyết khi đã rõ | Giữ nguyên ý; thêm "theo mẫu câu hỏi quyết định". Sửa tay dòng 19 (writer chỉ quản lý khối sinh tự động) |
| 9 | Memory `feedback_advisor_not_mechanical_worker.md`, `feedback_decide_when_option_clearly_wins.md` | Bản văn xuôi của cùng quy tắc | Rút còn lý do lịch sử + trỏ tới mẫu và AGENTS.md #2 |

Không gộp, vì nói việc khác:

- `domains/coding/skills/fgos-coding-exploring/SKILL.md:92-97` và `references/lock-decisions-and-write-context.md:8`: câu hỏi Socratic để khám phá quyết định sản phẩm, hỏi bằng văn xuôi mở. Đây là loại câu hỏi khác với câu hỏi chọn hướng; mẫu ghi rõ phạm vi để không đè lên.
- `core/skills/_shared/citation-format.md`: cách cite ID, không phải cách hỏi.
- `~/.claude/rules/CLAUDE.md` (ck) và `.claude/rules/review-audit-self-decision.md` (AgentKit cài, nằm trong `.gitignore`) có luật tương tự ("User Decisions": quyết định gốc, mối lo, đánh đổi, lựa chọn). Dự án của người khác; không sửa. Ghi nhận là trùng mà không gộp được.

## Việc cần làm

1. Sửa các chỗ trong repo theo bảng (mục 1–8 và 5b, trừ memory). `npm run build:skills` để render lại `.agents/skills` và `plugins/fgOS/skills`; không sửa tay bản render.
2. Sửa 2 memory (mục 9): `/home/vantt/.claude/projects/-home-vantt-projects-forgentX/memory/feedback_advisor_not_mechanical_worker.md`, `.../feedback_decide_when_option_clearly_wins.md` (ngoài repo, không tính vào numstat).
3. Kiểm: `git grep -n -E "Why this matters|Why this$|two-heading|hai heading" -- core domains src test AGENTS.md` ra 0 (3 skill bị ngắt dòng giữa "Why this" và "matters"); `git grep -n "decision-question" -- core domains AGENTS.md` liệt kê đúng các chỗ trỏ tới mẫu.

## Kiểm chứng

- Test render skill/doctrine đang có (`npm test` phần docs/skills) xanh.
- Net dòng của phase ≤ 0 ngoài bản render.

## Rủi ro

- Bỏ nhầm phần riêng của một skill khi rút gọn: mỗi chỗ chỉ thay đúng câu nói về cấu trúc câu hỏi.

## Kết quả (2026-10-08)

- Sửa 5 skill coding, `coordination-driver.md`, `fgos-run`, AGENTS.md:19 (sửa tay); `npm run build:skills` render đúng 14 file + `_shared/decision-question.md` ra `.agents/` và `plugins/` (tới được project khác). Net 0 dòng (46/46).
- 2 memory trỏ về mẫu.
- `git grep -E "Why this matters|Why this$|two-heading|hai heading"` trên core, domains, src, test, AGENTS.md, .agents, plugins: 0.
- test docs/skills/setup: 229/229 xanh.
