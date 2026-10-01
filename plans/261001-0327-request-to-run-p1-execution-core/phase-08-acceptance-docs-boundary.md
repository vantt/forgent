---
phase: 8
title: "Nghiệm thu ca 1 + docs + boundary"
status: pending
priority: P1
effort: "1.5d"
dependencies: [6, 7]
---

# Phase 8: Nghiệm thu ca 1 + docs + boundary

## Overview

Khai khẩu vị thật của owner vào config, chạy **ca nghiệm thu 1** (2 area tài liệu, bake-off đã sửa — synthesis §4b), ghi quyết định vào spec, cập nhật component-boundary, guard test, merge `main`.

## Requirements

- Functional:
  - **Khẩu vị (C6, Q1, Q4)**: `docs:write` → openai (tier qua rigor; `capabilities.docs:write.rigor: high` nếu owner muốn flagship mặc định); `docs:review` → claude `claude-cli-bwrap` + `confinement: required, host-write-denied` + persona; `code:implement` → gemini, `minCheckers: [reviewer, red-team]`, `verify: npm test`; `code:review` → claude (khác provider với gemini); research → gemini/xai standard; `patterns.reviewed.checkersByRigor` mặc định (red-team từ `high`).
  - **Ca 1 (bake-off đã sửa)**: 2 area docs (chọn area mẫu không thuộc phase chưa authorize của plan tài liệu, hoặc bản sao trong thư mục thử), cùng một Observe case:
    - nhánh engine: master loop với roster ghim reviewer khác provider;
    - nhánh gọn: `fgos run` + `reviewed` chạy **hai lần** (có và không red-team);
    - đo: Lead-active (số lệnh, số quyết định, thời gian chờ), số vòng × phút producer, số run phụ, tỉ lệ finding được chấp nhận, reviewer < 3 phút với 0 finding, tỉ lệ tới trạng thái cuối, đúng người (lệch không lý do = 0);
    - ca **kill-resume** (kill giữa vòng 2 rồi `--resume`);
    - ca **no-candidate** (chỉ một provider có posture read-only → phải từ chối + báo, không tự hạ — G6);
    - dùng tier hiện có (T đã merge → `rigor`).
  - **Docs**: `docs/specs/runner.md` "Lịch sử quyết định": Unit, `bind()` + bảng 5 mức, cửa `fgos run`, posture read-only, **supersede ADR-006 §6** (tường minh, không sửa ADR tại chỗ), xoá redirect/`dispatch-runs`/`executors.for`; `docs/platform/component-boundary.md`: authority L5 mới (bind, run door, L5↛L3 cho lõi mới); `CHANGELOG.md`.
  - **Guard test**: `src/runner/execution/**` không import `src/state/**`, `src/runner/coordination/**`; từ vựng chết của P1.
  - Doctor check: RunResult ghi file phải có `provenance.binding`.
- Non-functional: báo cáo nghiệm thu lưu `plans/261001-0327-request-to-run-p1-execution-core/reports/acceptance-case-1.md`.

## Related Code Files

- Modify: `.fgos/config.json`, `~/.fgos/config.json` (sửa tay, ghi diff), `docs/specs/runner.md`, `docs/platform/component-boundary.md`, `CHANGELOG.md`, `test/architecture.test.mjs` (hoặc test kiến trúc tương ứng), `src/setup/checks.mjs`
- Create: `plans/261001-0327-request-to-run-p1-execution-core/reports/acceptance-case-1.md`

## Implementation Steps

1. Cổng: việc lẻ A, B đã xong (track phase 1); full `npm test` xanh trên nhánh plan.
2. Khai khẩu vị; `fgos doctor` sạch.
3. Chạy ca 1 (cả hai nhánh + 2 ca phụ); thu số Observe; viết báo cáo so với mốc (cả phase cũ: 6 session, 25 run, ~6 h; 1 session: 10 run/3 vòng/137 phút worker, ~12 lệnh Lead).
4. Kết luận theo tiêu chí §0 (1, 2, 3, 4) + G1–G6; nếu thua chất lượng → ghi phần thiếu, đề xuất bổ sung vào `reviewed` (không mang lại engine) và báo owner trước khi merge.
5. Viết docs + boundary + guard; full `npm test` xanh; merge `--no-ff` vào `main`; chạy lại suite trên `main`; restart gateway nếu cần.
6. Cập nhật track `plan.md` (trạng thái P1, bằng chứng); dọn worktree P1.

## Success Criteria

- [ ] Báo cáo ca 1 có đủ chỉ số; mô hình gọn không thua engine ở tiêu chí 1, 2, 4; lệch người không lý do = 0; kill-resume và no-candidate đạt.
- [ ] Spec + boundary + CHANGELOG cập nhật; guard xanh; merge `main`.

## Risk Assessment

- Ca 1 cho thấy mô hình gọn thua → **không merge**; báo owner kèm số liệu và phần cần bổ sung (rủi ro track-level đã định trước).
- Chạy thật trên area thuộc plan tài liệu chưa authorize → không; dùng area mẫu/thư mục thử.
