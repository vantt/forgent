---
phase: 5
title: "Nghiệm thu + docs + boundary"
status: pending
priority: P1
effort: "1d"
dependencies: [3, 4]
---

# Phase 5: Nghiệm thu + docs + boundary

## Overview

Chứng minh "chạy phase N" và "câu tự do" chạy trọn qua driver chung trên mọi domain; ghi quyết định vào spec; cập nhật boundary (L2 → dữ liệu); merge `main`.

## Requirements

- Functional:
  - Nghiệm thu: (a) K1 prompt tự do (code); (b) K2 read-only inline; (c) một phase plan có `- unit:` với ≥ 3 Unit gồm song song + ledger; (d) nếu owner đã authorize (Q5): chạy thật một phase của plan tài liệu `plans/260925-documentation-authority-unification/` (Unit do Lead viết từ prose phase, owner duyệt Unit trước); nếu chưa → ghi "chờ Q5", không chặn merge.
  - Đo bằng Observe: Lead-active, can thiệp người, đúng người, tới trạng thái cuối; so với ca 1 P1.
  - Docs: `docs/specs/<area>.md` (area planning/doctrine và runner) "Lịch sử quyết định": Unit cho mọi đường vào, driver chung, bỏ DemandFacts, `decide` = `bind()`; `docs/platform/component-boundary.md`: L2 không còn quyết người/cơ chế; `CHANGELOG.md`.
  - Guard từ vựng: DemandFacts, matcher, `form`, skill đã xoá.
- Non-functional: báo cáo `reports/acceptance.md` trong thư mục plan.

## Related Code Files

- Modify: `docs/specs/runner.md` (+ spec area planning nếu có — tra `docs/specs/reading-map.md`), `docs/platform/component-boundary.md`, `CHANGELOG.md`, test guard từ vựng
- Create: `plans/261001-0327-request-to-run-p2-runnable-plans/reports/acceptance.md`

## Implementation Steps

1. Chạy (a)–(c), (d) nếu được phép; thu số.
2. Docs + boundary + guard.
3. Full `npm test` → merge `main` → chạy lại → cập nhật track `plan.md`.

## Success Criteria

- [ ] (a)–(c) đạt; (d) đạt hoặc ghi "chờ Q5".
- [ ] Spec/boundary/CHANGELOG/guard; merge `main`.

## Risk Assessment

- Chạy thật plan tài liệu khi chưa authorize → cấm; driver phải từ chối (đã có test phase 3).
