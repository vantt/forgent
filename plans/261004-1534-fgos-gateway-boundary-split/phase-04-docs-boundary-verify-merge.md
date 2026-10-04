---
phase: 4
title: "Docs, boundary, guard, chạy thật, merge"
status: pending
priority: P1
effort: "0.25d"
dependencies: [3]
---

# Phase 4: Docs, boundary, guard, chạy thật, merge

## Overview

Cho danh phận mới vào tài liệu và guard; chứng minh gateway và plugin vẫn chạy; merge.

## Requirements

- Functional:
  - `docs/platform/component-boundary.md`: hàng **fgos Gateway** (authority `apps/fgos-gateway/`: REST API, MCP `search`/`execute`, web dashboard bundle; lifecycle duy nhất `fgos gateway start|status|stop`); hàng **Herdr** còn transport + pane liveness + plugin `herdr-dashboard/` (TUI, pick/pane supervisor); hàng Host/Surface cập nhật; `Last reviewed`.
  - `AGENTS.md:132-134`: tiêu đề "Starting the **fgos** gateway"; nội dung bỏ "herdr-fgos gateway", nêu binary `fgos-gateway` và rằng MCP nằm trên cùng tiến trình này.
  - `docs/specs/herdr-web-dashboard.md`: chủ = fgos gateway, đường `apps/fgos-gateway/web`; `docs/specs/{work-state,runner,reading-map}.md`, `docs/explanation/*`, `docs/architect/component-boundary/*` theo inventory; `docs/doc-registry.json` nếu đường thay đổi.
  - Guard: `test/runner/dead-vocabulary-guard.test.mjs` **append** cụm "herdr-gateway" khi dùng cho gateway của fgOS (phạm vi docs/specs, docs/platform, AGENTS.md, src, core); cho phép khi đi kèm "reference implementation"/đường `~/projects/herdr-gateway`. Thêm `herdr-plugin`, `herdr-fgos` vào danh sách chết (ngoài lịch sử/CHANGELOG/fixture).
  - CHANGELOG `[Unreleased]`: đổi tên component + binary, bước owner đăng ký lại plugin với herdr.
  - **Chạy thật**: `fgos gateway stop` (gateway đang chạy pid cũ), `fgos gateway start` → `status` `reachable: true`, mở `/v1/contract`; mở web dashboard; owner đăng ký lại plugin với herdr theo lệnh phase 1 → mở một pane herdr thấy TUI `herdr-dashboard`. Ghi vào `reports/acceptance.md`.
  - Kiểm "không đổi hành vi": `git diff -M main..HEAD --stat` và đọc diff của mọi `.rs` ngoài dòng `use`/`mod`/Cargo — phải rỗng; ghi kết quả.
  - Full `npm test` (env `-u CLAUDE_CODE_SESSION_ID`, không chạy khi suite khác đang chạy, RAM available ≥ 3000MB) + `cargo test --workspace` xanh → merge `main` (`--no-ff`, từ checkout chính đang ở `main`); dọn worktree/nhánh.
- Non-functional: không "nhân tiện" sửa logic; phát hiện gì ghi vào acceptance làm sau.

## Related Code Files

- Modify: `AGENTS.md`, `docs/platform/component-boundary.md`, `docs/specs/**`, `docs/explanation/**`, `docs/architect/component-boundary/**`, `docs/doc-registry.json`, `test/runner/dead-vocabulary-guard.test.mjs`, `CHANGELOG.md`
- Create: `reports/acceptance.md`

## Implementation Steps

1. Docs + guard; test guard + citation drift xanh.
2. Chạy thật gateway + plugin; acceptance.
3. Suite; merge; dọn.

## Success Criteria

- [ ] Boundary doc có fgos Gateway là authority riêng; guard chặn tên lẫn; gateway + TUI chạy thật; suite xanh; merge.

## Risk Assessment

- herdr chưa đăng ký lại kịp → TUI vắng trong pane tới khi owner chạy lệnh; không chặn merge, ghi rõ trong acceptance.
