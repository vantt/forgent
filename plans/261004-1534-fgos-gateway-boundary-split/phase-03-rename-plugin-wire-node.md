---
phase: 3
title: "herdr-plugin → herdr-dashboard + nối Node"
status: completed
priority: P1
effort: "0.25d"
dependencies: [2]
---

# Phase 3: herdr-plugin → herdr-dashboard + nối Node

## Overview

Đổi tên plugin cho đúng việc nó làm; mọi chỗ Node/Rust/test đang trỏ `herdr-plugin`/`herdr-fgos` trỏ sang tên mới.

## Requirements

- Functional:
  - `git mv herdr-plugin herdr-dashboard`; crate `herdr-dashboard`, lib `herdr_dashboard`, bin `herdr-dashboard`; `herdr-plugin.toml` giữ tên file (quy ước herdr), exec → `$HERDR_PLUGIN_ROOT/target/release/herdr-dashboard`; `.gitignore` → `/herdr-dashboard/target/`.
  - `src/runner/gateway-control.mjs`: build + spawn `fgos-gateway` theo kết luận phase 1 (manifest-path/target-dir của `apps/fgos-gateway`), bỏ arg `gateway`; comment đầu file nói "fgos gateway".
  - Cập nhật theo inventory phase 1: `src/cli/command-registry.mjs` (mô tả verb `gateway`), `src/setup/registrations.mjs` + `checks.mjs` (doctor check nào nhắc binary/đường cũ), `bin-discovery.mjs`, `src/util/release-binary-path.mjs`, `src/state/{store,graph-harness,worker-slots}.mjs`, `packages/observe/rust/src/metrics_cli/harness.rs`, skill `discover*/SKILL.md` (sửa ở `core/skills` rồi `npm run build:skills`).
  - Test: `test/cli/fgos-gateway.test.mjs`, `test/runner/gateway-control.test.mjs`, `test/state/gate-bypass.test.mjs`, fixture nếu chỉ là chuỗi mô tả; `test/runner/dead-vocabulary-guard.test.mjs` để phase 4.
- Non-functional: không đổi hành vi verb `fgos gateway`; không đổi API REST/MCP.

## Related Code Files

- Move: `herdr-plugin/` → `herdr-dashboard/`
- Modify: như trên

## Implementation Steps

1. `git mv` + sửa Cargo/manifest; build workspace.
2. Sửa Node + Rust observe; chạy test liên quan (`fgos-gateway`, `gateway-control`, `gate-bypass`, `checks`, `registrations`, `fgos-mirror`).
3. Commit.

## Success Criteria

- [ ] `rg -n "herdr-plugin|herdr-fgos|herdr_fgos" src bin core domains packages apps herdr-dashboard test` rỗng (trừ fixture lịch sử có chú thích).
- [ ] Test liên quan xanh.

## Risk Assessment

- Fixture RunResult `real-shapes/*.json` chứa chuỗi cũ như dữ liệu lịch sử → giữ nguyên, ghi loại trừ trong guard.
