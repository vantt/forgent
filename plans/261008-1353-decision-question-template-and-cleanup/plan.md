---
title: Mẫu câu hỏi quyết định và gỡ các quy tắc hỏi trùng lặp
status: pending
created: 2026-10-08
budget: "src ≤ 60 dòng đổi; test ≤ 300 dòng đổi (chỉ fixture có sẵn + 1 case, 0 test file mới), vượt thì dừng và hỏi; instructions/skills/AGENTS ≤ 60 dòng, net ≤ 0 ngoài file mẫu (Phase 01–02); Phase 03 ≤ 50 dòng, không code mới ngoài 1 hằng số test; tổng ≤ 1,5 ngày"
paths: [core/skills/_shared/decision-question.md, core/instructions/decision-question.md, src/runner/prompt-templates/worker-prompt-discovery.txt, .fgos/instructions/effective/repo.json (sinh tự động), src/state/status-fsm.mjs, src/intake/plan.mjs, src/intake/discovery.mjs, test/ (chỉ fixture chứa '## Why this matters' và test validator), domains/coding/skills/fgos-coding-{discovering,exploring,implement,shaping,validating}/SKILL.md, core/skills/_shared/coordination-driver.md, core/skills/fgos-run/SKILL.md, docs/specs/platform-foundations.md (RUL11 + decision 0054), test/docs/rul11-anchor-phrase.test.mjs, domains/coding/skills/fgos-coding-planning/references/approach-and-shape.md, docs/decisions/index.md (sinh tự động), AGENTS.md (khối luật sinh tự động + sửa tay dòng 19 và mục RUL11), CHANGELOG.md, bản render của build:skills, 2 memory file]
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
| 03 | Khung đã duyệt: điểm dừng chung, supersede ADR0036 thêm vế phạm vi cho RUL11 | pending, sau 01 | [phase-03](phase-03-approved-frame.md) |

## Acceptance

- Một nguồn mẫu duy nhất (`core/skills/_shared/decision-question.md`); luật ngắn trỏ tới nó, chiếu vào AGENTS.md; validator `fgos ask` đòi các heading theo D1 (chấp nhận alias tiếng Anh), lỗi in đủ mẫu; mọi nơi sinh câu hỏi (5 chỗ + prompt worker) theo mẫu.
- Plan này **không** ràng buộc câu trả lời của owner vào phần "Phạm vi" và không có reviewer trên đường `fgos ask` (xem D2).
- `git grep -E "Why this matters|Why this$|two-heading|hai heading"` trên src, test, core, domains, AGENTS.md ra 0; các skill chỉ còn 1 dòng trỏ tới mẫu.
- Phase 03: luật có mục "Khung đã duyệt"; RUL11 có vế phạm vi qua ADR0054; khuôn plan của fgos-coding-planning có dòng phạm vi + ngân sách.
- `npm test` xanh. Diff nằm trong `budget`/`paths`; vượt thì dừng và hỏi theo mẫu.

## Ngoài phạm vi

- Test ngày càng nhiều và chậm: owner hẹn truy vết sau.
- Script pre-merge, doctor row, supersede L6, sửa L5: không làm.
- Luật review bắt buộc mục "xoá/không xây gì": chưa chốt.
- Dọn tài liệu/log/worktree phình (agent-coordination docs, log đã commit, 880 dòng dispatch advisory): không thuộc plan này.
- `~/.claude/rules/CLAUDE.md` (ck): dự án của người khác, không sửa.

## Red Team Review

### Session — 2026-10-08
**Findings:** 19 thô từ 2 reviewer (Assumption Destroyer; Security + Scope), gộp còn 13. 11 accept và đã áp dụng; 2 đưa owner quyết (D1, D2) cùng 2 câu hỏi phát sinh (D3, D4). 0 reject: mọi finding có `file:line` và kiểm lại đúng.
**Severity:** 2 Critical, 7 High, 4 Medium.

| # | Finding | Sev | Xử lý | Áp vào |
|---|---|---|---|---|
| 1 | Validator áp 5 phần lên cả câu hỏi Socratic/khám phá và câu hỏi worker headless | Critical | Owner quyết | D1 |
| 2 | Câu trả lời không bị ràng buộc bởi "Phạm vi"; gate rủi ro nhả với mọi câu trả lời không rỗng | Critical | Ghi thật vào Acceptance/Rủi ro; owner quyết | D2 |
| 3 | Regex `` không khớp heading tiếng Việt ("Khuyến nghị"), NFD | High | Accept: NFC + startsWith, test case hợp lệ | Phase 01 bước 3, 5 |
| 4 | Thiếu nơi sinh câu hỏi: `DEFAULT_UNCLEAR_QUESTION`, câu hỏi thô worker, prompt worker; phải giữ chuỗi lý do gate | High | Accept | Phase 01 Bối cảnh, bước 4 |
| 5 | Writer AGENTS.md chạy trên main checkout; `repo.json` ngoài paths | High | Accept: lệnh chiếu từ worktree, thêm paths | Phase 01 bước 2, plan paths |
| 6 | Khối chiếu chép toàn thân luật vào AGENTS.md; dòng 19 ngoài vùng writer | High | Accept: mẫu ở `_shared`, luật ≤ 8 dòng; sửa tay dòng 19 | Phase 01, 02, 03 |
| 7 | Project khác không thấy mẫu (chỉ nhận skill) | High | Accept: mẫu ở `core/skills/_shared/`; lỗi validator in đủ mẫu; alias tiếng Anh | Phase 01 |
| 8 | Biện pháp "reviewer trả lại câu hỏi" không tồn tại trên đường `fgos ask` | High | Accept: ghi thật, không thêm bước review | Phase 01 Rủi ro |
| 9 | Generator engine không biết giá/khuyến nghị → chữ đệm | High | Accept: ghi rõ "engine không định giá được" | Phase 01 bước 4 |
| 10 | Grep kiểm bỏ sót 3 skill ngắt dòng; số dòng lệch 1; thiếu xung đột `AskUserQuestion` của shaping | Medium | Accept | Phase 02 bảng, bước 3 |
| 11 | Luật luôn-nạp mới cần anchor phrase (RUL9/L8) | Medium | Accept: 1 assert trong test có sẵn | Phase 01 bước 5, Phase 03 bước 1 |
| 12 | Ngân sách src "≤ 60" chưa định nghĩa, có thể quá nhỏ (~75–90) | Medium | Định nghĩa thêm+xoá; nới cần owner | D4 |
| 13 | `--rationale`/`--alternatives` là kênh song song | Medium | Owner quyết | D3 |

### Whole-Plan Consistency Sweep
Đã đọc lại plan.md + 3 phase. Đã đổi mọi chỗ "mẫu ở core/instructions" sang `core/skills/_shared/decision-question.md`; "qua writer" sang lệnh chiếu từ worktree + sửa tay dòng 19/RUL11; grep kiểm thống nhất ở Phase 01/02/Acceptance. Còn mở: D1–D4 (chặn bắt đầu Phase 01).
