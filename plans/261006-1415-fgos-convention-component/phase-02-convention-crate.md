# Phase 02 — Crate `fgos-convention` + dữ liệu hợp đồng + golden test

Trạng thái: pending · Công: 1-1.5d · Phụ thuộc: phase 01

## Bối cảnh

- Spec `docs/platform/convention/spec.md` (phase 00) là nguồn yêu cầu; plan này không lặp lại hợp đồng.
- Mẫu: `packages/observe/rust/Cargo.toml` (phụ thuộc `fgos-host-runtime`, `serde`, `serde_json`, `thiserror` từ workspace), `packages/observe/rust/src/provider.rs` (descriptor + `OperationProvider`), `packages/observe/contracts/*.json`, test fixture hợp đồng `test/observe/observe-contracts-fixtures.test.mjs`.

## Yêu cầu

- Crate `fgos-convention`, bố cục đã quyết ở Q10: `packages/convention/contracts/` + `packages/convention/rust/{Cargo.toml,src,tests}`.
- Dữ liệu quy tắc và golden case là file JSON trong `contracts/`, nhúng bằng `include_str!`; code không chứa mẫu tên hay danh sách thư mục dạng literal ngoài file dữ liệu.
- Ba thao tác `name`, `path`, `check` là hàm thuần nhận `now`/`offset` qua tham số (đồng hồ ghim trong test); chỉ biên provider đọc đồng hồ thật và offset local (theo Q9).
- `check --all` là thao tác duy nhất đọc FS (duyệt thư mục quy tắc dưới root, không theo symlink thư mục).
- Provider descriptor + `OperationProvider` cho operation id đã chốt ở spec (đề xuất `convention.query`), nhưng **chưa** đăng ký vào `CATALOG` hay `apps/fgos` (phase 03).

## Files

Tạo:
- `packages/convention/contracts/convention.rules.v1.json` (kinds, mẫu, thư mục, mã lỗi)
- `packages/convention/contracts/convention.golden.v1.json` (case thành công/thất bại, có `at` và offset)
- `packages/convention/contracts/convention.query.v1.json` (schema request/outcome, theo kiểu file trong `packages/observe/contracts/`)
- `packages/convention/rust/Cargo.toml`, `src/lib.rs`, `src/rules.rs`, `src/operations.rs`, `src/provider.rs`, `tests/golden.rs`
Sửa: `Cargo.toml` (workspace `members` thêm `packages/convention/rust`).
Xoá/gộp: không xoá file. Không thêm bản thuật toán ngày (dùng `fgos_host_runtime::civil_time`). Không thêm crate thời gian/regex mới trừ khi spec ghi rõ lý do (`regex` không có trong workspace; UNPROVEN cần hay không — ưu tiên parser tay theo dữ liệu quy tắc).

## Các bước

1. Cổng impact: crate mới không sửa symbol cũ; chỉ `Cargo.toml` workspace. Vẫn chạy `detect_changes()` trước commit.
2. Viết `rules.rs` đọc `convention.rules.v1.json` (serde), từ chối dữ liệu hỏng lúc khởi tạo (test).
3. Viết `operations.rs`: `name`, `path`, `check_paths`, `check_all(root)`; chuẩn hoá slug và kiểm type theo Q7/Q8; offset theo Q9.
4. Nếu Q9 chọn local: lấy offset qua `libc::localtime_r` sau `#[cfg(unix)]`, nền khác → UTC; cô lập trong một hàm nhỏ có comment lý do `unsafe` (mẫu `store_lock.rs:121`).
5. `provider.rs`: descriptor + `OperationProvider`, parse subcommand + cờ, trả outcome typed (HI-I007: built-in không decode bytes).
6. `tests/golden.rs`: lặp qua `convention.golden.v1.json`, so khớp đúng từng byte. Thêm test: mọi mã lỗi trong rules có ít nhất một case golden thất bại; mọi kind có case cho cả ba thao tác.

## Kiểm chứng

- `cargo test -p fgos-convention` (tiêu chí 1, 3, 4 ở mức hàm).
- `cargo clippy -p fgos-convention`, `cargo fmt --check`.
- `cargo build -p fgos` vẫn xanh (crate chưa được dùng, chỉ kiểm workspace).

## Rủi ro

| Rủi ro | Khả năng × tác động | Giảm thiểu |
|---|---|---|
| Golden case viết lại trong code (hai nguồn) | Trung bình × Trung bình | Test chỉ đọc file golden; review grep literal `261006` trong `src/`. |
| Offset local sai trên máy CI (TZ khác) | Trung bình × Trung bình | Golden luôn truyền `--at` có offset; chỉ một test smoke dùng đồng hồ thật và kiểm hình dạng, không giá trị. |
| `unsafe` libc | Thấp × Trung bình | Một hàm, có test, chỉ unix. |

## Rollback

Revert commit; gỡ dòng workspace member. Không ảnh hưởng binary `fgos` vì chưa lắp.

## Commit

`feat(convention): add the naming and placement convention crate with golden cases`
