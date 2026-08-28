# Tổ chức lại layout repo (apps/packages) — tầm nhìn nền tảng

**Trạng thái:** TẦM NHÌN / ĐỊNH HƯỚNG — chưa khoá thành luật (platform-foundations)
hay spec đầy đủ; phần Rust/herdr-plugin đã chốt cây mục tiêu, phần Node
(`packages/core`, `config`, `state`, `shared`, vị trí thin-entry của
`orchestrator`) CHƯA làm, để đợt sau. **Ngày:** 2026-08-26.
**Nguồn:** định hướng của chủ sản phẩm.

Tài liệu này ghi lại tầm nhìn tổ chức root repo theo `apps/` (thin
entrypoint, chỉ wiring) + `packages/` (logic thật, thư viện) thay cho cấu
trúc phẳng hiện tại (`herdr-plugin/` gộp hết REST/MCP/TUI/web trong 1
Cargo package). Không thay đổi hành vi runtime nào — chỉ tổ chức lại vị trí
vật lý của code đã có.

## 1. Vì sao

`herdr-plugin/` hiện là 1 Cargo package (`herdr-fgos`, cùng tên lib+bin)
gộp 2 chế độ chạy khác nhau trong cùng 1 binary, phân nhánh bằng arg
(`main.rs`: không arg = TUI, arg `gateway` = daemon REST/MCP/web). Soi thực
tế `src/runner/gateway-control.mjs:295` xác nhận `fgos gateway start` chạy
`spawn(binaryPath, ['gateway'])` — tên "gateway" không khớp hành vi mặc
định của binary, dễ gây hiểu lầm khi chạy raw binary.

Soi code cho thấy ranh giới hexagon đã tồn tại thật, chỉ chưa phản ánh ra
cấu trúc thư mục:
- `ports.rs` đã định nghĩa 5 trait: `WorkItemSource`, `PaneRegistry`,
  `PaneOrchestrator`, `VerbGateway`, `TerminalUi`.
- `main.rs`'s comment gốc: "gateway mode is a separate launch path from the
  TUI's" (D1, tsk-7l9-2).
- `gateway.rs`/`mcp.rs` chỉ import `crate::ports::VerbGateway` — **zero**
  phụ thuộc vào `app.rs`/`ui.rs`/`layout.rs`/`pane_scan.rs`/`pick.rs`.

Quyết định: tách thành 2 binary thật (`apps/gateway`, `apps/herdr-tui`),
mỗi binary tên = đúng hành vi mặc định, không cần arg để phân biệt. Toàn bộ
logic thật dời vào `packages/*` dạng lib crate; `apps/*` chỉ còn
`Cargo.toml` + `src/main.rs` mỏng để wire các package lại và start.

Về web dashboard: gateway **đã** tự host static bundle qua `rust_embed`
(`gateway.rs:1230` struct `WebAssets`, `#[folder = "static/"]`) —
không phải đề xuất mới, là hành vi đã chốt từ D10/D14 (tsk-48w, tsk-6d2
"realignment", xem
`docs/explanation/why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md`).
Dời `herdr-plugin/web/` thành `packages/web-dashboard/` chỉ đổi vị trí
vật lý, không đổi cơ chế embed/serve.

## 2. Cây mục tiêu (phạm vi Rust + web — Node CHƯA làm)

```
forgentX/
  Cargo.toml                    # [workspace] members = ["apps/gateway", "apps/herdr-tui",
                                 #   "packages/gateway", "packages/mcp", "packages/herdr-core",
                                 #   "packages/herdr-ui", "packages/fgos-ports"]

  apps/
    gateway/                     # THIN: Cargo.toml + src/main.rs — wire packages/gateway +
                                  # packages/mcp, start axum server, serve static/. Chạy KHÔNG
                                  # cần arg = daemon (khác `herdr-fgos gateway` hiện tại).
      static/                     # gitignored, nhận build output từ packages/web-dashboard
      build.rs                     # giữ nguyên logic: đảm bảo static/ tồn tại trước khi RustEmbed quét

    herdr-tui/                   # THIN: Cargo.toml + src/main.rs — wire packages/herdr-core +
                                  # packages/herdr-ui, chạy TUI loop. Chạy KHÔNG cần arg = TUI.

  packages/
    gateway/                     # gateway.rs (2245d, REST routes) + cf_access.rs (555d,
                                  # Cloudflare Access JWT) — logic thật của gateway
    mcp/                          # mcp.rs (645d) — MCP surface; apps/gateway mount vào cùng
                                  # axum router lúc wire (giữ nguyên "mounted on SAME process")
    herdr-core/                    # app.rs (1454d, App state) + layout.rs (1063d, OperationPanes)
                                    # + pane_scan.rs (405d) + pick.rs (757d) — pane_scan/pick
                                    # gộp vào đây (đều là domain logic của cockpit, pane_scan.rs
                                    # đã import pick::is_valid_id)
    herdr-ui/                       # ui.rs (1001d, render crossterm)
    fgos-ports/                       # ports.rs (5 trait, 201d) + fgos.rs (adapter CLI shell-out,
                                       # 942d) + settings.rs (config chung 2 app, 189d)
    web-dashboard/                     # herdr-plugin/web/ (Vite/TS/React/Tailwind) — KHÔNG phải
                                        # Cargo crate; script "bundle" đổi outDir
                                        # ../static → ../../apps/gateway/static
```

## 3. Việc cơ học phải sửa khi thực thi (không phải quyết định, chỉ liệt kê blast radius)

- `src/runner/gateway-control.mjs:240` — path tới binary compiled, trỏ sang `apps/gateway`.
- `src/runner/gateway-control.mjs:273` — `cargo build --release --bin herdr-fgos` → build đúng package `apps/gateway` trong workspace.
- `src/runner/gateway-control.mjs:295` — `spawn(binaryPath, ['gateway'])` → bỏ arg `'gateway'`, binary giờ chỉ có 1 hành vi.
- `herdr-plugin/web/package.json`'s script `bundle`: `--outDir ../static` → `--outDir ../../apps/gateway/static`.
- Bất kỳ nơi nào load `herdr-tui` binary làm plugin cho tool `herdr` gốc (upstream, `upstreams/herdr/`) — cần trỏ đúng binary mới.
- `herdr-plugin.toml`, mọi path reference `herdr-plugin/` trong docs/tests/CI (AGENTS.md's "Starting the herdr gateway" section, `docs/specs/reading-map.md`, `docs/specs/herdr-web-dashboard.md`, test files).

## 4. Phạm vi đợt này

Chỉ tổ chức lại phần liên quan Rust (`herdr-plugin/` → `apps/{gateway,herdr-tui}` +
`packages/{gateway,mcp,herdr-core,herdr-ui,pane-scan,fgos-ports,web-dashboard}`).

**Chưa làm, để đợt sau (Node side):**
- `packages/core` — Node fgOS core hiện ở root (`bin/`, `src/`).
- `packages/config`, `packages/state`, `packages/shared` — chưa map vào file thật.
- `packages/orchestrator` — đồng ý đặt logic `src/runner/` + `bin/fgos-runner.mjs` vào đây,
  nhưng **chưa chốt vị trí thin-entry** (bin mỏng tương ứng nằm ở đâu — root `bin/`, hay
  `apps/cli/bin/`).
- Tên `orchestrator` là pinned vocabulary đã chốt nghĩa "tầng hợp thành T0" trong cơ chế
  dispatch/runner (D-ADR0026→0028→0029→0031, xem `docs/decisions/index.md` dòng 28-32) —
  `packages/orchestrator` phải đúng khớp nghĩa đó, không phải khái niệm khác. `herdr-plugin`
  (Rust) cũng có 1 khái niệm "orchestrator" khác, không liên quan (`herdr_orchestrator`
  settings.rs — toggle operation-pane auto-launch) — 2 nghĩa không được lẫn.

## Câu hỏi còn mở

- Vị trí thin-entry Node cho `orchestrator` (root `bin/` hay `apps/cli/bin/`)?
- `cf_access.rs` hiện gộp chung `packages/gateway` — tách riêng `packages/cf-access` nếu sau này có nhu cầu reuse ngoài gateway?
- `pane_scan.rs`/`pick.rs` đã gộp vào `packages/herdr-core` cùng `app.rs`/`layout.rs` — tách riêng khi nào có ranh giới rõ hơn (nếu `herdr-core` phình quá to)?
