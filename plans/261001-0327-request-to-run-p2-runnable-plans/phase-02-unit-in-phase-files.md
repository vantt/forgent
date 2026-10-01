---
phase: 2
title: "Unit trong phase file (plan-lint)"
status: pending
priority: P1
effort: "1d"
dependencies: [1]
---

# Phase 2: Unit trong phase file

## Overview

`fgos plan-lint` đọc block `- unit:` trong **phase file** (không chỉ `plan.md`), chuẩn hoá về Unit của P1 (`validateUnit`), kiểm tất định: id trùng, `dependsOn` có vòng, `writes` giao nhau giữa các Unit không `dependsOn` nhau, ghim hạ tầng (G2), capability không có trong config.

## Requirements

- Functional:
  - Đọc `plan.md` + `phase-*.md`; chọn phase theo `--phase N`.
  - Trả Unit[] chuẩn (dùng `validateUnit`); `--json` cho driver.
  - Lỗi cứng: ghim hạ tầng; vòng phụ thuộc; `writes` giao nhau không có `dependsOn`; id trùng. Cảnh báo: capability không có key trong config (`domain:verb` lẫn fallback `verb`); `pattern` lạ.
  - Bỏ phần `## Product Gates` nếu nó trùng nghĩa Unit (kiểm phase 1; một dạng duy nhất — RUL11).
  - fgOS **chỉ đọc** plan (quyết định (b)); không ghi trạng thái vào `plan.md`; **không** đọc authorize từ prose (authorize = cổng người của Workflow run).
  - Đầu ra `--json` là đầu vào của bộ dịch plan → Workflow (P3a) — một đường đọc Unit duy nhất.
- Non-functional: thuần đọc; không gọi `decide`/`bind`.

## Related Code Files

- Modify: `src/report/capability-plan-lint.mjs`, `bin/fgos.mjs` (verb `plan-lint`), `src/cli/command-registry.mjs` (mục `plan-lint`)
- Tests: `test/report/capability-plan-lint*.test.mjs` (fixture plan nhiều phase)

## Implementation Steps

1. GitNexus `impact` plan-lint.
2. Test trước: phase có 3 Unit hợp lệ; vòng; `writes` giao; ghim `executor`; capability thiếu key (cảnh báo).
3. Sửa plan-lint dùng `validateUnit`.
4. Commit → merge nhánh plan.

## Success Criteria

- [ ] `fgos plan-lint <plan> --phase N --json` trả Unit[] chuẩn; 5 ca test xanh.
- [ ] Không còn đường đọc Unit thứ hai.

## Risk Assessment

- Plan AgentKit thật không có block → driver xử lý (phase 3), plan-lint chỉ gợi ý.
