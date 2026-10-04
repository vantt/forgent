---
phase: 1
title: "Sự thật + inventory"
status: pending
priority: P1
effort: "0.25d"
dependencies: []
---

# Phase 1: Sự thật + inventory

## Overview

Chốt bằng `file:line` mọi chỗ phải đổi để phase 2–3 chỉ move/rename, không mò.

## Requirements

- Functional — ghi vào `plan.md` mục "Sự thật phase 1":
  1. `src/runner/gateway-control.mjs`: lệnh cargo đúng (manifest-path? target-dir?), đường binary, arg spawn (`:236-300`); test tương ứng trong `test/runner/gateway-control.test.mjs`.
  2. Toàn bộ `use crate::…`/`herdr_fgos::…` trong 4 file gateway và 6 file plugin; xác nhận gateway chỉ cần `fgos::{resolve_fgos,is_tier_zero}`, `ports::VerbGateway`, `settings::{read_web_dashboard_settings,WebDashboardSettings}`; plugin cần gì từ 3 file chung.
  3. `build.rs` + `RustEmbed` path trong `gateway.rs:1249-1270`; `web/package.json` script `bundle` ghi `static/` ở đâu.
  4. Inventory tham chiếu ngoài crate (lệnh `rg -n "herdr-plugin|herdr-fgos|herdr_fgos" --glob '!archive/**' --glob '!plans/**' --glob '!docs/history/**' --glob '!target/**' .`) → bảng file → đổi thành gì.
  5. `~/.config/herdr/plugins.json` entry của plugin (chỉ ghi `manifest_path`, `plugin_root`, exec; không in giá trị khác) → lệnh herdr để đăng ký lại sau rename (đọc `herdr plugin --help`).
  6. Tên crate chung: chốt `herdr-fgos-common` hoặc tên tốt hơn, một dòng lý do.
  7. GitNexus `impact` cho `gateway::run`, `VerbGateway`, hàm spawn trong `gateway-control.mjs`; không có MCP → ghi `impact-analysis: degraded`, dùng rg.
- Non-functional: chỉ sửa plan; worktree `../forgentX-gateway-split` (nhánh `refactor/fgos-gateway-boundary`) từ `main`, symlink `node_modules`, `target`.

## Related Code Files

- Modify: `plan.md`, `phase-02..04` của plan này.

## Implementation Steps

1. Worktree + symlink. 2. Trả lời 7 mục. 3. Commit plan.

## Success Criteria

- [ ] 7 mục có `file:line`; bảng inventory đầy đủ.

## Risk Assessment

- Inventory thiếu → phase 4 `rg` bắt được; không merge khi còn.
