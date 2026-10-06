# Phase 03 — Lắp route native + command-routes + test tương thích

Trạng thái: pending · Công: 1d · Phụ thuộc: phase 02

## Bối cảnh

Đường lắp đã trace (phase 00 Q4). `command-routes.json` là file **sinh**: `scripts/export-command-selectors.mjs` đọc `COMMAND_REGISTRY` (`src/cli/command-registry.mjs`) + `packages/host-runtime/contracts/command-route-annotations.json`; doctor `command-routes-drift` (`src/setup/registrations.mjs:4755`) và test `test/rust-host/command-routes.test.mjs` (selector khớp `COMMAND_REGISTRY.length`, dòng 33) canh lệch. Không sửa tay `command-routes.json`.

## Yêu cầu

- `fgos convention <name|path|check>` chạy native qua `InvocationService`, trả một phong bì `fgos.v1` (qua `cli_presenter`).
- Gộp nhánh subcommand mã cứng `main.rs:158-160` (`if selector == "metrics" ... else friction`) thành tra bảng `selector → AVAILABLE_SUBCOMMANDS` gồm metrics, friction, convention. Xoá nhánh if/else.
- Không đổi hành vi của metrics/friction/version/gate-bypass.

## Files

Sửa:
- `packages/host-runtime/rust/src/catalog.rs` (thêm `OperationDescriptor`; test `catalog_contains_required_operations` `:103-111` đổi 5 → 6 và thêm id)
- `apps/fgos/Cargo.toml` (dependency `fgos-convention`)
- `apps/fgos/src/main.rs` (`COMPOSITION_PROVIDERS`, `register_provider`, bảng subcommand)
- `apps/fgos/src/cli_projector.rs` (nhánh operation mới + test projector, theo mẫu `test_project_cli_invocation_for_metrics`)
- `packages/host-runtime/contracts/command-route-annotations.json` (mục `convention`: `native`, operation id, `owner_path: packages/convention/rust`, `subcommands: true`)
- `src/cli/command-registry.mjs` (mục `convention`, `nativeOnly: true`, `touchesState: false`, ví dụ `fgos convention name --type audit --slug x`)
- `packages/host-runtime/contracts/command-routes.json` (sinh lại bằng script)
- `test/rust-host/command-routes.test.mjs` (assert `routes.convention.route_kind === 'native'` và `owner_path`)
Xoá/gộp: nhánh if/else subcommand trong `main.rs` → một bảng.

## Các bước

1. Index GitNexus mới (`node .gitnexus/run.cjs analyze`), rồi `impact` upstream cho: `CATALOG`, `main` (apps/fgos), `project_cli_invocation`, `COMMAND_REGISTRY`, `generateCommandRoutes` (script). Báo blast radius; `main` và `CATALOG` dự kiến HIGH (mọi lệnh native đi qua) → báo anh trước khi sửa. Đối chiếu bằng `rtk proxy rg`.
2. Thêm descriptor vào `CATALOG`; chạy `cargo test -p fgos-host-runtime catalog` (gồm test re-parse id `:111`).
3. Lắp provider trong `main.rs`; đổi nhánh subcommand thành bảng; giữ nguyên message lỗi hiện có (test Node có thể so chuỗi — grep `requires a subcommand` trong `test/`).
4. Thêm nhánh projector.
5. Thêm annotation + mục registry; chạy `node scripts/export-command-selectors.mjs` để sinh lại, rồi `--check`.
6. Thêm assert vào `command-routes.test.mjs`.

## Kiểm chứng

- `cargo test -p fgos` (projector, presenter).
- `node --test test/rust-host/command-routes.test.mjs`; `node scripts/export-command-selectors.mjs --check` thoát 0 (tiêu chí 5).
- Smoke bằng binary vừa build, không qua release kích hoạt: `target/debug/fgos convention name --type report --slug harness-audit --at 2026-10-06T14:15:00+07:00 --json` (tiêu chí 1), tương tự `path` và `check` (tiêu chí 2, 3).
- `rtk proxy rg -n 'selector == "metrics"' apps/fgos/src/main.rs` = 0 (tiêu chí 6).
- `target/debug/fgos metrics ping`, `target/debug/fgos friction ping`, `target/debug/fgos version` vẫn như cũ.
- Rộng: `env -u CLAUDE_CODE_SESSION_ID npm test` (help/manifest test `test/cli/fgos-manifest.test.mjs` đọc `COMMAND_REGISTRY`).
- `detect_changes({scope:"compare", base_ref:"main"})` trước commit.

## Phụ thuộc Plan A

Lệnh `fgos convention` qua cửa `fgos` thật (release dán digest) chỉ chạy sau khi build và kích hoạt lại theo quy trình của Plan A. Không chặn phase này: mọi kiểm chứng dùng `target/debug/fgos`.

## Rủi ro

| Rủi ro | Khả năng × tác động | Giảm thiểu |
|---|---|---|
| Đổi bảng subcommand làm lệch message của metrics/friction | Trung bình × Trung bình | Giữ chuỗi; chạy test observe Node. |
| `nativeOnly` khiến Node `bin/fgos.mjs` xử lý `convention` lạ | Thấp × Thấp | `bin/fgos.mjs:4576` có nhánh `if (entry?.nativeOnly)` (đã grep); đọc nhánh đó và xác nhận `convention` đi cùng đường với `metrics`. |
| Gateway (`apps/fgos-gateway`, ngoài workspace) dùng `CATALOG` cho `remote` | Thấp × Thấp | Read-only; nếu spec chọn chỉ `cli` thì đặt `allowed_host_kinds: ["cli"]`. |

## Rollback

Revert commit; chạy lại `export-command-selectors.mjs` để file sinh khớp registry.

## Commit

`feat(convention): route fgos convention natively through the Rust host`

## Hiệu chỉnh sau red-team (2026-10-06)

Mục này **thắng** nội dung cũ của phase khi mâu thuẫn. Bằng chứng đã được lead tự đo lại (script hoặc `rtk proxy`), chi tiết ở bảng Red Team Review trong `plan.md`.

- Thêm `test/rust-host/vectors/envelope/version.json` (sinh lại bằng `test/rust-host/generate-vectors.mjs`) vào Files: thêm verb `convention` làm đổi danh sách động từ trong vector, và `test/rust-host/envelope-contract.test.mjs` so sánh với file. Có 13 nơi dùng `COMMAND_REGISTRY`: `scripts/export-command-selectors.mjs`, `src/cli/{version,command-registry}.mjs`, `bin/fgos.mjs`, `test/rust-host/{command-routes.test,generate-vectors}.mjs`, `test/cli/{knowledge-deprecation,fgos-help,fgos-manifest,command-registry,dispatch-operability}.test.mjs`, `test/runner/{dispatch-operability-production-door,dead-vocabulary-guard}.test.mjs`. Kiểm hẹp chạy thêm `node --test test/rust-host/envelope-contract.test.mjs`.
- `check` trả `Completed` (mã thoát 0) nên **không** chạm `cli_presenter.rs`; nếu phase nào buộc phải đổi bộ trình bày thì phải được liệt kê ở đây.
