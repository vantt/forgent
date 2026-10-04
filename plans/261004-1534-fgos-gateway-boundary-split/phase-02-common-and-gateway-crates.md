---
phase: 2
title: "Crate dùng chung + crate fgos-gateway"
status: pending
priority: P1
effort: "0.5d"
dependencies: [1]
---

# Phase 2: Crate dùng chung + crate fgos-gateway

## Overview

Move nguyên file, chỉ đổi `use`/`mod`/tên crate. Cuối phase, workspace build xanh với **cả ba** crate (herdr-plugin cũ tạm phụ thuộc crate chung — rename ở phase 3).

## Requirements

- Functional:
  - `packages/herdr-fgos-common/rust/` (tên theo phase 1): `Cargo.toml` lib; `git mv` `fgos.rs`, `ports.rs`, `settings.rs` vào `src/`; `lib.rs` chỉ `pub mod`. Dependencies copy đúng những gì 3 file cần.
  - `apps/fgos-gateway/`: `Cargo.toml` (bin `fgos-gateway`), `git mv` `gateway.rs`, `mcp.rs`, `cf_access.rs`, `remote_invocation.rs`, `build.rs`, `web/` vào đây; `src/main.rs` mới **tối thiểu**: resolve root như `herdr-plugin/src/main.rs:24-33` đang làm rồi `gateway::run(root)` — không arg `gateway`. `RustEmbed` path + `build.rs` trỏ `static/` của crate mới; `web/package.json` bundle ra đó.
  - `herdr-plugin` (chưa rename): bỏ 7 module đã move, thêm dependency crate chung, đổi `use`; nhánh `gateway` trong `main.rs:31-33` **xoá** (gateway có bin riêng).
  - `Cargo.toml` gốc: thêm 2 member; `Cargo.lock` cập nhật; `.gitignore`: `/apps/fgos-gateway/target/`, `/apps/fgos-gateway/static/` (giữ dòng cũ tới phase 3).
  - `cargo build --release --workspace` + `cargo test --workspace` xanh; `cargo clippy` không lỗi mới.
- Non-functional: diff trong file `.rs` move = chỉ `use`/path. Không đổi tên hàm, không sửa logic, không gộp file.

## Related Code Files

- Create: `packages/herdr-fgos-common/rust/{Cargo.toml,src/lib.rs}`, `apps/fgos-gateway/{Cargo.toml,src/main.rs}`
- Move: như trên (`git mv` để giữ lịch sử)
- Modify: `Cargo.toml`, `Cargo.lock`, `.gitignore`, `herdr-plugin/Cargo.toml`, `herdr-plugin/src/{lib.rs,main.rs}` (+ `use` trong 5 file plugin)

## Implementation Steps

1. Tạo crate chung, move 3 file, build.
2. Tạo crate gateway, move 4 file + build.rs + web, main.rs mới, build; `npm run bundle` trong `web/` → `static/` đúng chỗ.
3. Sửa herdr-plugin, xoá nhánh `gateway`; build + test toàn workspace; commit theo từng bước (3 commit).

## Success Criteria

- [ ] Workspace build/test xanh; `target/release/fgos-gateway` chạy được (`--help` hoặc start/stop tay trong worktree với `--dir`).
- [ ] `git diff -M --stat` cho thấy rename, không phải delete+add.

## Risk Assessment

- `ports.rs` kéo theo type của plugin (pane…) vào crate chung → chấp nhận (user: không tối ưu); ghi vào acceptance làm việc sau.
