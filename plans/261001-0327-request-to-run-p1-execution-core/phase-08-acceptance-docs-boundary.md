---
phase: 8
title: "Nghiệm thu ca 1 (qua pane herdr) + docs + boundary"
status: done
priority: P1
effort: "1.5d"
dependencies: [6, 7]
---

# Phase 8: Nghiệm thu ca 1 + docs + boundary

## Overview

Khai khẩu vị thật vào config, chạy **ca nghiệm thu 1** **qua pane herdr** (G7; bake-off đã sửa — synthesis §4b), ghi quyết định vào spec, cập nhật component-boundary, guard, merge `main`.

## Requirements

- Functional:
  - **Khẩu vị**: `docs:write` → openai (`capabilities.docs:write.rigor: high` nếu owner muốn flagship mặc định); `docs:review` → claude + persona; `code:implement` → gemini, `minCheckers: [reviewer, red-team]`, `verify: npm test`; `code:review` → claude; research → gemini/xai standard; `patterns.reviewed.checkersByRigor` mặc định (red-team từ `high`). Không còn invocation `*-readonly` — posture do fgOS áp.
  - **Ca 1** (cổng: việc lẻ A ✓, B xong): 2 area docs (thư mục thử, không thuộc phase chưa authorize của plan tài liệu), cùng một Observe case:
    - nhánh engine: master loop với roster ghim reviewer khác provider;
    - nhánh gọn: `fgos run` + `reviewed` **qua pane herdr**, chạy **hai lần** (có và không red-team);
    - đo: Lead-active (lệnh, quyết định, thời gian chờ), số vòng × phút producer, run phụ, tỉ lệ finding chấp nhận, reviewer < 3 phút & 0 finding, tỉ lệ tới trạng thái cuối, đúng người (lệch không lý do = 0), transport thực (herdr/cli);
    - ca **kill-resume**; ca **no-candidate** (G6); ca **provider-limit** (giả lập màn hình limit → candidate kế, pane cũ giữ); ca **không có herdr** (cli fallback, cùng kết quả).
  - **Docs**: `docs/specs/runner.md` "Lịch sử quyết định": Unit, Unit run, `bind()` + bảng 5 mức, cửa `fgos run`, posture confinement cho herdr + cli, G7, quota X-3, xoá `*-readonly`/redirect/`executors.for`/PolicyPatch prefer*, **supersede ADR-006 §6** (tường minh), D-ADR0033 giữ nguyên; `docs/platform/component-boundary.md`: authority L5 mới (bind, run door, posture; herdr = transport chính + bề mặt quan sát); `CHANGELOG.md`.
  - **Guard**: append vào `test/runner/dead-vocabulary-guard.test.mjs` (file T tạo); test kiến trúc lõi `execution`.
  - Doctor check: RunResult mutating có binding khớp snapshot `unit.json`.
- Non-functional: báo cáo `reports/acceptance-case-1.md`.

## Related Code Files

- Modify: `.fgos/config.json`, `~/.fgos/config.json` (sửa tay, ghi diff), `docs/specs/runner.md`, `docs/platform/component-boundary.md`, `CHANGELOG.md`, `test/runner/dead-vocabulary-guard.test.mjs`, test kiến trúc, `src/setup/checks.mjs`
- Create: `plans/261001-0327-request-to-run-p1-execution-core/reports/acceptance-case-1.md`

## Implementation Steps

1. Cổng: việc lẻ A ✓, B; full `npm test` xanh trên nhánh plan; spike phase 6 đạt.
2. Khai khẩu vị; `fgos doctor` sạch.
3. Chạy ca 1 + 4 ca phụ; thu số; viết báo cáo so với mốc (cả phase cũ: 6 session, 25 run, ~6 h; 1 session: 10 run/3 vòng/137 phút worker, ~12 lệnh Lead) và với điểm đo sớm phase 5.
4. Kết luận theo §0 tiêu chí 1–4 + G1–G7; thua chất lượng → bổ sung vào `reviewed`, báo owner trước khi merge.
5. Docs + boundary + guard; full `npm test` (Node + Rust); merge `--no-ff` vào `main`; chạy lại; `fgos gateway stop/start` nếu gateway chạy; cập nhật track `plan.md`; dọn worktree P1.

## Success Criteria

- [x] Ca 1 qua herdr đạt; 4 ca phụ đạt; không thua engine ở tiêu chí 1, 2, 4.
- [x] Spec + boundary + CHANGELOG + guard; merge `main`.

## Risk Assessment

- Ca 1 thua → **không merge**; báo owner kèm số liệu.
- Không có herdr trên máy chạy nghiệm thu → chạy trên máy có herdr; ca cli chỉ là ca phụ.
