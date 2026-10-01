---
phase: 3
title: "Driver chung"
status: pending
priority: P1
effort: "2d"
dependencies: [2]
---

# Phase 3: Driver chung

## Overview

Một skill core (đề xuất `fgos-run`) thay `fgos-code-change`: nhận **câu tự do** hoặc **"chạy phase N của plan X"** → Unit[] (đọc qua plan-lint, hoặc Lead viết từ prose) → lập lịch theo `dependsOn` (Unit độc lập chạy song song, mỗi Unit ghi file một worktree) → `fgos run` từng Unit → gom kết quả, gom câu hỏi cho người thành một bộ. Mọi domain, không gate chỉ-code.

## Requirements

- Functional:
  - Đường vào: (a) prompt tự do → Lead hiểu + viết Unit (theo doctrine phase 4); (b) plan có `- unit:` → `plan-lint --json`; (c) plan không có block → Lead viết Unit từ prose của phase, hiển thị Unit cho anh xem khi rigor ≥ high (không chặn khi thấp).
  - Kiểm authorize: plan AgentKit có bảng phase/authorize → đọc (chỉ đọc); phase chưa authorize → từ chối chạy, báo rõ.
  - Lập lịch: `src/runner/execution/plan-reader.mjs` (thuần) đọc Unit[] → sóng theo `dependsOn`; mở worktree cho Unit ghi file (tái dùng `src/runner/worktree.mjs` qua interface, không import `src/state/**` từ lõi execution — nếu cần claim/lock thì qua lệnh CLI hiện có).
  - Mở một Observe case cho cả lần chạy; đóng khi xong.
  - Ràng buộc riêng của plan (vd "ledger một người ghi") biểu diễn bằng Unit riêng có `dependsOn` + `writes` riêng — không thêm khái niệm.
  - Xoá gate `code:implement|refactor`; xoá `domains/coding/skills/fgos-code-change/` sau khi skill mới chạy (single path); `npm run build:skills`.
- Non-functional: driver **không** tuần tự nhiều phase (P3); không giữ state riêng ngoài `unit-runs` + Observe case.

## Architecture

```text
input ─► Unit[] (plan-lint | Lead) ─► plan-reader: sóng theo dependsOn ─► mỗi Unit: worktree? ─► fgos run ─► RunResult
                                                                                  └► câu hỏi người: gom một bộ (Release con người)
```

## Related Code Files

- Create: `core/skills/fgos-run/SKILL.md` (+ references), `src/runner/execution/plan-reader.mjs`, test
- Delete: `domains/coding/skills/fgos-code-change/` (sau cutover)
- Modify: wrapper skill sinh ra (qua `npm run build:skills`), `core/skills/fgos-routing/SKILL.md` (trỏ sang driver mới, chỉ phần routing tới facade)

## Implementation Steps

1. Test `plan-reader` trước (sóng, vòng → lỗi, song song đúng).
2. Viết skill + plan-reader; chạy thử K1 (prompt tự do), K3 thu nhỏ (2 area + 1 ledger Unit) trên plan fixture.
3. Cutover: xoá `fgos-code-change`; `rg fgos-code-change` sửa mọi tham chiếu; build skills.
4. Commit → merge nhánh plan.

## Success Criteria

- [ ] K1 và K3-thu-nhỏ chạy trọn qua driver; ledger Unit chạy sau cùng, một writer.
- [ ] Phase chưa authorize → từ chối.
- [ ] `rg fgos-code-change core domains plugins docs` chỉ còn lịch sử.

## Risk Assessment

- Lead viết Unit sai (unit quá to, `writes` thiếu) → plan-lint bắt giao nhau; tín hiệu Observe: finding > 2 vòng thường xuyên → bổ sung ví dụ doctrine.
