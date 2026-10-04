---
title: "Tách fgos gateway ra khỏi herdr-plugin; herdr-plugin thành herdr-dashboard"
description: "Một crate herdr-plugin hiện chứa hai thứ khác nhau: (1) fgos gateway — REST API + MCP + bundle web dashboard, chạy detached qua `fgos gateway start`; (2) plugin herdr thật — TUI trong pane herdr + supervisor pick/pane. Vì gộp chung nên toàn repo gọi lẫn là 'herdr-gateway' (trùng tên repo tham chiếu ngoài ~/projects/herdr-gateway). Tách thuần cơ học: gateway thành component riêng có tên và authority riêng; phần còn lại đổi tên herdr-dashboard. Không tối ưu, không đổi hành vi."
status: pending
priority: P1
effort: "~1–1.5d"
tags: [boundary, rename, gateway, herdr, rust, docs]
created: 2026-10-04
blockedBy: []
blocks: []
---

# Tách fgos gateway ra khỏi herdr-plugin

## Overview

Owner chốt (2026-10-04): cái đang chạy detached (REST API + MCP + web dashboard) là **fgos gateway**, không phải "herdr-gateway". `herdr-plugin/` chỉ là một plugin của herdr: TUI trong pane + một ít supervisor. Hai thứ này nằm chung một crate `herdr-fgos` (bin duy nhất, `main.rs:31` rẽ nhánh `gateway` → `gateway::run`), nên code, docs, AGENTS.md và cả người đều gọi lẫn. Tách ra để mỗi bên có **danh phận riêng** — chỉ move/rename, không chỉnh logic.

### Hiện trạng (kiểm 2026-10-04)

| Nhóm | File (`herdr-plugin/src/`) | Thuộc về |
|---|---|---|
| Gateway | `gateway.rs` (2448, REST + `ServeDir` bundle web, `RustEmbed` `static/`), `mcp.rs` (645), `cf_access.rs` (555), `remote_invocation.rs` (492), `build.rs`, `web/` (Vite bundle → `static/`, gitignored) | **fgos gateway** |
| Plugin herdr | `main.rs` (2173, entrypoint plugin + nhánh `gateway`), `app.rs`, `layout.rs`, `ui.rs`, `pane_scan.rs`, `pick.rs` | **herdr-dashboard** |
| Dùng chung | `fgos.rs` (1078, adapter gọi CLI fgos: `resolve_fgos`, `is_tier_zero`…), `ports.rs` (traits `VerbGateway`, `PaneRegistry`, `PaneOrchestrator`…), `settings.rs` (`read_web_dashboard_settings`, `OrchestratorSettings`) | cả hai |

Gateway chỉ dùng từ phần chung: `fgos::{resolve_fgos,is_tier_zero}`, `ports::VerbGateway`, `settings::{read_web_dashboard_settings,WebDashboardSettings}`.

Bên ngoài crate (live, không tính archive/plans/history): `src/runner/gateway-control.mjs` (spawn `herdr-plugin/target/release/herdr-fgos gateway`), `src/cli/command-registry.mjs`, `src/setup/{registrations,bin-discovery}.mjs`, `src/util/release-binary-path.mjs`, `src/state/{store,graph-harness,worker-slots}.mjs`, `packages/observe/rust/src/metrics_cli/harness.rs`, `Cargo.toml` (member), `.gitignore:87-91`, tests `test/cli/fgos-gateway.test.mjs`, `test/runner/gateway-control.test.mjs`, `test/runner/dead-vocabulary-guard.test.mjs`, `test/state/gate-bypass.test.mjs`, skill `discover*/SKILL.md`, `AGENTS.md:132-134`, `docs/platform/component-boundary.md:66,70`, `docs/specs/{herdr-web-dashboard,work-state,runner,reading-map}.md`, `docs/explanation/*`, `docs/architect/*`, `CHANGELOG.md`. herdr nạp plugin qua `~/.config/herdr/plugins.json` → `herdr-plugin/herdr-plugin.toml`, exec `$HERDR_PLUGIN_ROOT/target/release/herdr-fgos` (**config ngoài repo, owner phải đăng ký lại sau rename**).

### Hình dạng đích

| Component | Vị trí | Crate / bin | Chứa |
|---|---|---|---|
| **fgos gateway** | `apps/fgos-gateway/` | `fgos-gateway` / bin `fgos-gateway` (không cần arg `gateway`) | `gateway.rs`, `mcp.rs`, `cf_access.rs`, `remote_invocation.rs`, `build.rs`, `web/`, `static/` |
| **herdr-dashboard** (plugin herdr) | `herdr-dashboard/` (rename từ `herdr-plugin/`) | `herdr-dashboard` / bin `herdr-dashboard` | `main.rs` (bỏ nhánh `gateway`), `app.rs`, `layout.rs`, `ui.rs`, `pane_scan.rs`, `pick.rs`, `herdr-plugin.toml` (tên file theo quy ước herdr, sửa exec) |
| **dùng chung** | `packages/herdr-fgos-common/rust/` (tên chốt ở phase 1) | lib `herdr-fgos-common` | `fgos.rs`, `ports.rs`, `settings.rs` — move nguyên, chỉ đổi `use` |

Quyết định đi kèm (owner có thể đổi trước khi chạy):
- **Web dashboard bundle đi với gateway**, vì nó được nhúng vào binary gateway lúc compile và chỉ nói chuyện với REST của gateway; `herdr-dashboard` là dashboard **trong terminal** của herdr. Spec `herdr-web-dashboard.md` giữ tên nhưng ghi rõ chủ là fgos gateway.
- Phần dùng chung tách thành crate lib riêng thay vì để gateway phụ thuộc vào plugin (nếu không, lẫn lộn còn nguyên).
- Từ vựng: "herdr-gateway" là tên **repo tham chiếu ngoài** (`~/projects/herdr-gateway`); từ nay không được dùng để chỉ gateway của fgOS. Guard từ vựng chết chặn cách dùng đó trong docs/code mô tả component của mình; nhắc tới repo ngoài vẫn được.

## Phases

| # | Phase | Phụ thuộc | Sở hữu |
|---|---|---|---|
| 1 | [Sự thật + inventory](./phase-01-facts-inventory.md) | — | plan |
| 2 | [Crate dùng chung + crate fgos-gateway](./phase-02-common-and-gateway-crates.md) | 1 | `packages/herdr-fgos-common/rust/**`, `apps/fgos-gateway/**`, `Cargo.toml`, `Cargo.lock`, `.gitignore` |
| 3 | [herdr-plugin → herdr-dashboard + nối Node](./phase-03-rename-plugin-wire-node.md) | 2 | `herdr-dashboard/**`, `src/runner/gateway-control.mjs`, `src/cli/command-registry.mjs`, `src/setup/{registrations,bin-discovery,checks}.mjs`, `src/util/release-binary-path.mjs`, `src/state/{store,graph-harness,worker-slots}.mjs`, `packages/observe/rust/src/metrics_cli/harness.rs`, test liên quan |
| 4 | [Docs, boundary, guard, chạy thật, merge](./phase-04-docs-boundary-verify-merge.md) | 3 | `AGENTS.md`, `docs/platform/component-boundary.md`, `docs/specs/**`, `docs/explanation/**`, skill, `CHANGELOG.md`, `test/runner/dead-vocabulary-guard.test.mjs` |

## Success Criteria

- [ ] `cargo build --release --workspace` xanh; `cargo test --workspace` xanh; binary `fgos-gateway` và `herdr-dashboard` tồn tại; không còn crate/bin `herdr-fgos`.
- [ ] `fgos gateway start|status|stop` chạy binary `fgos-gateway`, không cần arg `gateway`; `fgos gateway status` báo `reachable: true`; web dashboard mở được.
- [ ] herdr nạp `herdr-dashboard` từ `herdr-dashboard/herdr-plugin.toml` (owner đăng ký lại; ghi lệnh vào acceptance); TUI/pick hoạt động như trước.
- [ ] `rg -n "herdr-plugin|herdr-fgos|herdr_fgos" src bin core domains packages apps herdr-dashboard docs/specs docs/platform AGENTS.md CHANGELOG.md` rỗng (trừ dòng lịch sử/CHANGELOG, và nhắc tới repo ngoài `herdr-gateway` kèm chú thích).
- [ ] `docs/platform/component-boundary.md`: hàng mới **fgos Gateway** (authority `apps/fgos-gateway`: REST API, MCP, web dashboard bundle, lifecycle `fgos gateway`); hàng Herdr thu về transport + `herdr-dashboard` plugin; `Last reviewed` cập nhật.
- [ ] Guard từ vựng chết: "herdr-gateway" chỉ "gateway của fgOS" → đỏ; test xanh.
- [ ] Không đổi hành vi: diff logic trong các file `.rs` move chỉ là đường `use`/`mod`/crate name (phase 4 kiểm bằng `git diff -M --stat` và đọc diff ngoài dòng `use`).
- [ ] Full `npm test` xanh; merge `main`.

## Risk Assessment

| Rủi ro | Tín hiệu | Phản ứng |
|---|---|---|
| `cargo build` của gateway-control dùng `--manifest-path`/`--target-dir` riêng (binary hiện ở `herdr-plugin/target/`, không ở `target/` gốc) | `fgos gateway start` không tìm thấy binary | phase 1 đọc `gateway-control.mjs:230-300` và chốt đường build/binary mới; test `gateway-control.test.mjs` cập nhật theo |
| herdr mất plugin sau rename (config ngoài repo) | pane herdr không còn TUI fgOS | giữ symlink tạm `herdr-plugin → herdr-dashboard` **không** — owner đăng ký lại bằng lệnh herdr; acceptance ghi lệnh; làm ngay sau merge |
| `static/` của web bị gitignore theo đường cũ | build gateway thiếu bundle | `.gitignore` đổi sang `/apps/fgos-gateway/{target,static}/`; `build.rs` đi theo |
| Kéo theo sửa logic "nhân tiện" | diff ngoài `use`/path | phase 4 từ chối; mở item khác |
| Tên crate chung gây tranh cãi | — | phase 1 chốt một tên, ghi lý do một dòng; không bàn thêm |

## Câu hỏi mở

Không có (hai quyết định đi kèm ở trên đã chốt theo đề xuất; owner đổi thì sửa plan trước khi chạy).

<!-- slug: fgos-gateway-boundary-split -->
