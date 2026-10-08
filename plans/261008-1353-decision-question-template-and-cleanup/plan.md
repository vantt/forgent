---
title: Mẫu câu hỏi quyết định và gỡ các quy tắc hỏi trùng lặp
status: pending
created: 2026-10-08
budget: "src ≤ 60 dòng đổi; test ≤ 300 dòng đổi (chỉ fixture có sẵn + 1 case, 0 test file mới), vượt thì dừng và hỏi; instructions/skills/AGENTS ≤ 60 dòng, net ≤ 0 ngoài file mẫu; ≤ 1 ngày"
paths: [core/instructions/decision-question.md, src/state/status-fsm.mjs, src/intake/plan.mjs, src/intake/discovery.mjs, test/ (chỉ fixture chứa '## Why this matters' và test validator), domains/coding/skills/fgos-coding-{discovering,exploring,implement,shaping,validating}/SKILL.md, core/skills/_shared/coordination-driver.md, core/skills/fgos-run/SKILL.md, AGENTS.md (qua writer), CHANGELOG.md, bản render của build:skills, 2 memory file]
---

# Mẫu câu hỏi quyết định và gỡ các quy tắc hỏi trùng lặp

## Vì sao có plan này

Thảo luận 2026-10-08 ([brief](../reports/prompt-261008-bloat-root-cause-discussion.md)) chốt cơ chế phình chính:

1. Gate nghiệm thu không đạt được bằng phạm vi đã khai (advisory: live gate bị môi trường chặn → sửa dispatch ~880 dòng ngoài Exclusions; doc-unification: gate "mỗi claim đúng một lần" trên ~1.700 file → 21.044 dòng tool).
2. Agent dừng nhưng hỏi kiểu "giờ anh muốn sao" — không nguyên nhân, không giá, không khuyến nghị.
3. Owner trả lời không hiểu ("làm tiếp phase 2"), câu trả lời bị ghi thành giấy phép mở rộng.

Quy tắc "hỏi cho rõ" đang nằm rải ở nhiều nơi dạng văn xuôi (5 skill coding, coordination-driver, fgos-run, AGENTS.md, memory) và code tsk-539 chỉ bắt `## Context`/`## Why this matters` ở cửa `fgos ask`. Owner chọn: **một mẫu duy nhất + một dòng luật + sửa validator `fgos ask`**, áp cho mọi vai (implementer, lead, reviewer), và **gỡ các chỗ nói trùng**.

## Phases

| # | Phase | Trạng thái | File |
|---|---|---|---|
| 01 | Mẫu câu hỏi quyết định + validator `fgos ask` | pending | [phase-01](phase-01-decision-question-template.md) |
| 02 | Gỡ các chỗ nói trùng về cách hỏi | pending, sau 01 | [phase-02](phase-02-remove-duplicate-question-rules.md) |

## Acceptance

- Một file mẫu duy nhất; validator `fgos ask` đòi đủ 5 phần; AGENTS.md có mục luật trỏ tới mẫu qua instruction registry.
- Không còn `## Why this matters` trong src, test, core, domains, AGENTS.md; các skill chỉ còn 1 dòng trỏ tới mẫu.
- `npm test` xanh. Diff nằm trong `budget`/`paths`; vượt thì dừng và hỏi theo mẫu.

## Ngoài phạm vi

- Test ngày càng nhiều và chậm: owner hẹn truy vết sau.
- Ngân sách bắt buộc cho mọi plan, script pre-merge, doctor row, supersede L6, sửa RUL11: chưa chốt.
- Dọn tài liệu/log/worktree phình (agent-coordination docs, log đã commit, 880 dòng dispatch advisory): không thuộc plan này.
- `~/.claude/rules/CLAUDE.md` (ck): dự án của người khác, không sửa.
