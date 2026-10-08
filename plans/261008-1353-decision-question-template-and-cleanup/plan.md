---
title: Mẫu câu hỏi quyết định và dọn dẹp phần phình
status: pending
created: 2026-10-08
budget: "src ≤ 60 dòng đổi; test chỉ đổi chuỗi fixture có sẵn, 0 test file mới; docs/instructions ≤ 60 dòng; ≤ 1 ngày cho Phase 01; Phase 02 chỉ được xoá/di chuyển, net dòng phải âm"
paths: [core/instructions/, src/state/status-fsm.mjs, src/intake/plan.mjs, src/intake/discovery.mjs, test/ (chỉ fixture chứa '## Why this matters'), core/skills/fgos-coding-*/SKILL.md, core/skills/fgos-panel/SKILL.md, AGENTS.md (qua writer của nó), CHANGELOG.md, docs/architect/agent-coordination/, plans/**/*.log, archive/plans/**/*.log, .claude/worktrees/]
---

# Mẫu câu hỏi quyết định và dọn dẹp phần phình

## Vì sao có plan này

Thảo luận 2026-10-08 ([brief](../reports/prompt-261008-bloat-root-cause-discussion.md)) chốt cơ chế phình chính:

1. Gate nghiệm thu không đạt được bằng phạm vi đã khai (advisory: live gate bị môi trường chặn → sửa dispatch ~880 dòng ngoài Exclusions; doc-unification: gate "mỗi claim đúng một lần" trên ~1.700 file → 21.044 dòng tool).
2. Agent dừng nhưng hỏi kiểu "giờ anh muốn sao" — không nguyên nhân, không giá, không khuyến nghị.
3. Owner trả lời không hiểu ("làm tiếp phase 2"), câu trả lời bị ghi thành giấy phép mở rộng.

Quy tắc "hỏi cho rõ" đã có ở 4 nơi dạng văn xuôi và đều thất bại; code tsk-539 chỉ bắt `## Context`/`## Why this matters` ở cửa `fgos ask`. Owner chọn: **một mẫu duy nhất + một dòng luật + sửa validator `fgos ask`**, áp cho mọi vai (implementer, lead, reviewer), và plan phải gồm dọn dẹp.

## Phases

| # | Phase | Trạng thái | File |
|---|---|---|---|
| 01 | Mẫu câu hỏi quyết định thay quy tắc cũ | pending | [phase-01](phase-01-decision-question-template.md) |
| 02 | Dọn dẹp phần phình (chờ owner trả lời bộ câu hỏi bên dưới) | pending | [phase-02](phase-02-cleanup.md) |

Phase 02 không phụ thuộc Phase 01 về code; chỉ cần owner trả lời các câu hỏi D1–D5.

## Acceptance

- Một file mẫu duy nhất; validator `fgos ask` đòi đủ 5 phần của nó; không còn chuỗi `## Why this matters` trong src/test/skills.
- AGENTS.md có đúng một dòng luật trỏ tới mẫu (qua instruction registry, không sửa tay phần render).
- `npm test` xanh. Diff Phase 01 nằm trong `budget`/`paths`; vượt thì dừng và hỏi theo mẫu.
- Phase 02: mỗi mục dọn có quyết định owner ghi kèm; net dòng/MB âm; không thêm code mới.

## Ngoài phạm vi

- Test ngày càng nhiều và chậm: owner hẹn truy vết sau.
- Dòng ngân sách bắt buộc trong mọi plan, script pre-merge, doctor row, supersede L6, sửa RUL11: chưa được owner chốt.
- `~/.claude/rules/CLAUDE.md` (ck) — dự án của người khác, không sửa.

## Câu hỏi cho owner (theo mẫu mới, trả lời một lần)

Xem [phase-02 § Bộ câu hỏi D1–D5](phase-02-cleanup.md#bộ-câu-hỏi-d1d5). Phase 01 không cần thêm quyết định.
