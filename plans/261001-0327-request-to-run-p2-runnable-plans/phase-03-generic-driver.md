---
phase: 3
title: "Driver mỏng trên Workflow runner"
status: done
priority: P1
effort: "1.5d"
dependencies: [2]
---

# Phase 3: Driver mỏng trên Workflow runner

## Overview

Skill core **`fgos-run`** thay `fgos-code-change`: nhận **câu tự do**, **"chạy phase N"** hoặc **"chạy phase A..B của plan X"** → dựng Unit[] → giao **Workflow runner** (P3a) → runner lập lịch theo `dependsOn`, mở cổng người, gọi `fgos run` từng Unit (pane herdr — G7), tích hợp kết quả → driver báo lại, gom câu hỏi cho người thành một bộ. Mọi domain. **Driver không tự lập lịch, không tự merge** (Q-C, red-team mục 7).

## Requirements

- Functional:
  - Đường vào: (a) prompt tự do → Lead hiểu + viết Unit (doctrine phase 4) → `fgos workflow start --units <file>` (Workflow một bước); (b) plan có `- unit:` → `fgos workflow start --plan <dir> --phases N|A..B` (bộ dịch plan → Workflow của P3a, dùng `plan-lint --json` của phase 2 để đọc Unit); (c) plan không có block → Lead viết Unit từ prose phase, trình owner ở cổng người khi rigor ≥ high, rồi như (a).
  - Authorize: không parse từ prose; phase chưa được owner duyệt → runner park ở cổng người "authorize phase N" (owner trả lời `fgos workflow answer`). fgOS không ghi `plan.md`.
  - Ràng buộc riêng của plan (vd "ledger một người ghi") = Unit riêng có `dependsOn` + `writes` riêng — không thêm khái niệm.
  - Một Observe case cho cả yêu cầu (runner mở/đóng).
  - Xoá `domains/coding/skills/fgos-code-change/` sau khi skill mới chạy; sửa mọi tham chiếu (`rg fgos-code-change core domains docs AGENTS.md`); `core/skills/fgos-routing/SKILL.md` trỏ sang `fgos-run` (chỉ phần routing tới facade). Cây skill sinh ra tái sinh khi merge plan (không commit trong nhánh phase).
- Non-functional: skill thuần prose + lệnh CLI; không module JS mới (không `plan-reader`).

## Architecture

```text
câu tự do / "phase N" / "phase A..B" ─► Unit[] ─► fgos workflow start (P3a) ─► runner: dependsOn · cổng người · fgos run (herdr) · tích hợp
                                                                            └► câu hỏi gom một bộ ─► fgos workflow answer
```

## Related Code Files

- Create: `core/skills/fgos-run/SKILL.md` (+ references)
- Delete: `domains/coding/skills/fgos-code-change/`
- Modify: `core/skills/fgos-routing/SKILL.md` (mục facade), tài liệu tham chiếu `fgos-code-change`

## Implementation Steps

1. Viết skill; chạy thử K1 (prompt tự do, code), K3 thu nhỏ (2 area + 1 ledger Unit) trên plan fixture, plan nhiều phase có một phase chưa duyệt.
2. Cutover: xoá `fgos-code-change`; sửa tham chiếu.
3. Commit → merge nhánh plan.

## Success Criteria

- [x] K1, K3-thu-nhỏ, plan nhiều phase chạy trọn qua runner; ledger Unit chạy sau cùng, một writer; phase chưa duyệt dừng ở cổng người.
- [x] `rg fgos-code-change core domains docs AGENTS.md` chỉ còn lịch sử.

## Risk Assessment

- Lead viết Unit sai (to quá, `writes` thiếu) → plan-lint bắt giao nhau; Observe: finding > 2 vòng thường xuyên → bổ sung ví dụ doctrine.
