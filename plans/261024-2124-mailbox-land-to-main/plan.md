---
title: "MAIL: land nhánh mailbox/v1-v3 vào main"
description: "Thứ tự, điều kiện chờ, file chung và cổng kiểm để merge nhánh Agent Mailbox (V1–V7, V7m) vào main sau cutover Work của fg-server."
status: draft
lane: MAIL
---

# Land `mailbox/v1-v3` vào main

Owner 2026-10-24 21:22 "đọc board để chuẩn bị land", 21:3x "nhớ trao đổi với các phiên". Nhánh @ `43e422ff3`: 291 commit, 366 file, base `359ef9bc1`; main đi trước 157 commit (đã cutover Work ở `51bee6b53`).

## Điều kiện trước khi bắt đầu

| # | Điều kiện | Ai | Trạng thái |
|---|---|---|---|
| C1 | Dòng board "cutover xong" của fg-server (lệnh WORK 10-24 21:25: không pull/merge main ở fg-server tới lúc đó) | WORK, CFG, COOK | chờ |
| C2 | Review Git: `main_checkout_root` trong `packages/git/rust/src/driver.rs` (`bd9b6343f`, `17359341b`, `6b47b1903`) | OPC `claude-muyt@fg-server2` | nhờ từ 16:20, chưa trả lời |
| C3 | Mục `mailbox` trong `core/config-schema` và bộ đọc mailbox (`packages/mailbox/rust/store/src/limits.rs`) chuyển sang `snapshot()` của `fgos-config`; tới lúc đó project đã `config migrate` thấy mailbox tắt với lý do `config:migrated` | CFG `claude-hrpe@fg-server` | nhờ từ 16:20, chưa trả lời |
| C4 | Khoá config ghi đè luật người nhận (spec §16 Q14) | MAIL + CFG | đề xuất: land với chữ v3 làm mặc định cố định, khoá ghi đè làm item riêng sau; chờ owner |
| C5 | Hàng hook mailbox chỉ cài mặc định khi mọi máy chạy release có native kind (V5-Q2) | MAIL | giữ: chỉ cài khi project bật `mailbox.enabled` |

## File chung (bảng "File chung dễ va" của board)

| File | Báo cho |
|---|---|
| `apps/fgos/src/main.rs`, `packages/host-runtime/contracts/command-routes.json` (+ annotations), `packages/git/contracts/mutation-census.v1.json`, `docs/platform/component-boundary.md`, `docs/platform/{git,holder-lock,host-invocation-routing}/spec.md` | HARDEN, DOC, SEAT, TEST, GIT |
| `packages/holder-lock/contracts/lock-registry.v1.json` và schema (mutex `mailbox`) | HARDEN (chủ lock), DOC (D8) |
| `src/setup/registrations.mjs`, `CHANGELOG.md`, `docs/specs/distribution.md`, `docs/routing-handoff-contract.md` | mọi lane đang sửa |
| `bin/fgos.mjs`, `src/cli/command-registry.mjs` | COOK |
| `packages/config/rust/src/files.rs` | CFG |
| `packages/identity/rust/*` | IDENT |
| `src/runner/dispatch/confinement/resources.mjs`, `docs/specs/confinement-authority.md` | CFG (Slice D), chính MAIL (đã land `b267a0e75`) |
| `packages/distribution/rust/src/shim.rs` | không lane DIST; review vai DIST đã duyệt (`286426014` + sửa `8f366ccc3`, `f09ca4849`) |

Luật: land sau thì merge main và soát xung đột ngữ nghĩa với thay đổi của lane kia; báo board trước khi sửa.

## Các bước

1. **Sync một lần** (sau C1): merge `origin/main` vào nhánh (không rebase), giải xung đột theo bảng trên; sinh lại census (`git-one-door-scan --write-census`), `npm run build:skills` nếu skill đổi.
2. **Cổng kiểm, tuần tự** (`free -g` ≥ 8, không chạy song song): `cargo test --workspace` (`CARGO_BUILD_JOBS=4`, `--test-threads=4`), rồi `npm test -- --test-concurrency=4`. So lỗi với baseline của `origin/main` cùng commit; không lỗi mới.
3. **Review độc lập cuối** trên diff merge (code-reviewer, Git và holder-lock do OPC/HARDEN xem phần của họ).
4. **Owner duyệt land.** Land qua worktree tách rời từ `origin/main` (merge `--no-ff`), dòng board nêu commit, file chung đã đụng, lane bị ảnh hưởng.
5. **Sau land:** không tự activate release dùng chung; báo các máy rằng hook mailbox chỉ hoạt động khi release có native kind được activate và project bật `mailbox.enabled`.

## Tiêu chí xong

- Main chứa V1–V7 + V7m, spec §16/§17 khớp quyết định owner (mặc định A = chữ v3; v1 cho model/CLI/đường chưa đo; đường đánh thức tắt).
- `cargo test --workspace` và `npm test` không có lỗi mới so với main; census khớp.
- C2, C3 có trả lời trên board; C4, C5 ghi rõ trong spec và CHANGELOG.

## Câu treo

- C4: land với v3 cố định, khoá ghi đè sau? (đề xuất: có)
