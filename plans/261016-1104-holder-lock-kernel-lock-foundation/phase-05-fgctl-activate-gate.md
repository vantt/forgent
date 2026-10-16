# Phase 05: cổng activate trong `fgctl` — borrow vectors + probe ngữ nghĩa

Wave 1. Nhánh `holder-lock/p05-fgctl-gate`, worktree `.claude/worktrees/hl-p05`. Phụ thuộc: P00; nghiệm thu sau P02 (link `fgos-holder-lock`).

## Yêu cầu

Ngay trước `publish_activation_file` ([`init.rs:539`](../../packages/distribution/rust/src/init.rs)) ở mọi đường activate (init gần [`:944`](../../packages/distribution/rust/src/init.rs), upgrade [`:1377`](../../packages/distribution/rust/src/init.rs), repair [`:1588`](../../packages/distribution/rust/src/init.rs); executor grep `publish_activation_file(` và `publish_and_tail(` để chắc không sót), `fgctl` gọi bằng crate nó tự link (Lead D4, không chạy gì dưới `candidate_dir`):

1. `fgos_holder_lock::guarantee(lock_dir)` cho `<workspace>/.fgos/locks` và `<lockRoot>`, cộng probe ngữ nghĩa hai process thật (con giữ EX, cha probe phải `Held`; con chết, cha phải `Free`).
2. `fgos_holder_lock::borrow_vectors::run(git)`.

Kết quả:
- Linux/macOS: probe hoặc vector đỏ → không publish, lỗi `lock-kernel-semantics-failed` / `lock-borrow-vectors-failed` kèm chi tiết. Đây là cổng bật driver macOS (quyết định A2).
- Windows: driver `unsupported` → không chạy vector, activate vẫn qua, in một dòng "holder-lock: unsupported on Windows until the 4.4 driver" (A2). fs mạng (`none`) → từ chối có tên.
- Không có cờ tắt.

Bỏ `lockProtocolFloor` và trường `lockProtocol` (Lead D7).

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `packages/distribution/rust/src/init.rs`, `apps/fgctl/Cargo.toml` |
| sửa | `test/rust-host/fgctl-init-preflight-tail.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs` |

`packages/distribution/rust/Cargo.toml`, `store.rs` thuộc P02.

## Test

1. Cargo: cổng chạy ở init, upgrade, repair; mount tmp thật → qua.
2. Vector đỏ thật: một git trên `PATH` của test có `gc.auto=1` mà không bỏ được qua `-c` (wrapper script bỏ đối số `-c gc.auto=0` rồi exec git thật) → activate từ chối; git thật → qua. Wrapper là fixture môi trường, không phải nhánh code.
3. `env -u ... node --test test/rust-host/fgctl-*.test.mjs`; `cargo test -p fgos-distribution -p fgctl`.

## Tiêu chí nghiệm thu / rollback

Activate từ chối khi đỏ ở cả ba đường; thời gian cổng ghi trong báo cáo (mục tiêu < 1 s). Rollback: revert.
