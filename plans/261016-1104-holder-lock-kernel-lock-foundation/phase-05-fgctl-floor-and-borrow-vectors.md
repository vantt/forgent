# Phase 05: `lockProtocol` trong manifest, sàn ở `fgctl`, borrow vectors trước publish

Wave 1. Nhánh `holder-lock/p05-fgctl-floor`, worktree `.claude/worktrees/hl-p05`. Phụ thuộc: P00; nghiệm thu sau P02 (link `fgos-holder-lock` cho `state_root` và `borrow_vectors`) và P03 (`src/holder-lock/protocol.mjs`).

## Prior art (tái dùng)

Cổng tương thích có sẵn: `check_state_schema_compatibility` ([`init.rs:1172`](../../packages/distribution/rust/src/init.rs)) đọc `manifest.state_schemas` ([`manifest.rs:40,186`](../../packages/distribution/rust/src/manifest.rs)), gọi ở upgrade ([`init.rs:1374`](../../packages/distribution/rust/src/init.rs)) và repair ([`:1585`](../../packages/distribution/rust/src/init.rs)). Sàn lock đi cùng đúng chỗ đó, cùng kiểu lỗi có tên. Preflight không chạy gì dưới `candidate_dir` ([`init.rs:441-447`](../../packages/distribution/rust/src/init.rs)) — giữ nguyên (Lead D4).

## Yêu cầu

1. Manifest: trường tuỳ chọn `lockProtocol: u32` (vắng = 1). Build ([`scripts/build-rust-distribution.mjs`](../../scripts/build-rust-distribution.mjs), [`scripts/run-rust-dev-host.mjs`](../../scripts/run-rust-dev-host.mjs)) ghi giá trị đọc từ `src/holder-lock/protocol.mjs` (P03).
2. `check_lock_protocol_floor(fgos_dir, lock_root, manifest)`: đọc `<fgosDir>/installation/lock-protocol-floor.json` và `<lockRoot>/lock-protocol-floor.json`; `manifest.lockProtocol < max(floor)` → `lock-protocol-below-floor: candidate release speaks lock protocol N, workspace floor is M`. Gọi ở init (gần [`:944`](../../packages/distribution/rust/src/init.rs)), upgrade (`:1374`), repair (`:1585`), và ở mọi đường rollback về `previousArtifactDigest` (executor grep `previousArtifactDigest` trong `packages/distribution/rust/src` và liệt kê từng chỗ trong báo cáo).
3. Borrow vectors ở activate (kongming M4, r4 §6.1.1 điểm 8): ngay trước `publish_activation_file` ([`init.rs:539`](../../packages/distribution/rust/src/init.rs)), `fgctl` gọi `fgos_holder_lock::borrow_vectors::run(git)` bằng crate nó tự link. Đỏ → không publish, lỗi `lock-borrow-vectors-failed` kèm vector đỏ. Driver `none` (Windows ở 4.2) → bỏ qua có ghi chú, không fail (mức báo ở doctor). Không có cờ tắt.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `packages/distribution/rust/src/{manifest.rs,init.rs}`, `apps/fgctl/Cargo.toml` |
| sửa | `scripts/build-rust-distribution.mjs`, `scripts/run-rust-dev-host.mjs` |
| sửa | `test/rust-host/fgctl-upgrade.test.mjs`, `test/rust-host/fgctl-init-preflight-tail.test.mjs` (thêm ca), `test/rust-host/release-tree.test.mjs` (manifest có `lockProtocol`) |

`packages/distribution/rust/Cargo.toml` và `store.rs` thuộc P02.

## Test

1. Cargo: manifest có/không `lockProtocol`; floor workspace 3, ứng viên 1 → từ chối ở init, upgrade, repair, rollback; floor vắng → qua.
2. Node rust-host: `fgctl upgrade` với release tree build từ nhánh (có `lockProtocol: 3`) qua; release tree giả lập cũ không phải là mock — dùng một release tree build từ commit trước 4.2 (`git worktree add` tạm ở `.fgos/runtime/tmp/`, build, dọn) và kiểm bị từ chối khi sàn = 3.
3. Vector ở activate: một git wrapper trên `PATH` của test làm `gc --auto` chạy nền giữ fd (chỉ trong test, script thật) → activate từ chối; git thật → qua.

Lệnh: `cargo test -p fgos-distribution -p fgctl`; `env -u ... node --test test/rust-host/fgctl-*.test.mjs test/rust-host/release-tree.test.mjs`.

## Tiêu chí nghiệm thu

Sàn chặn mọi đường activate/rollback dưới sàn; vector chạy đúng một lần mỗi activate, < 1 s mục tiêu (ghi số đo).

## Rủi ro / rollback

- `fgctl` cũ (đã cài) không biết sàn: sàn chỉ là trải nghiệm; hàng rào ở P04 mới là chốt (r4 §6.8 bước 4). Runbook P12 cài `fgctl` mới trước.
- Rollback: revert; file sàn không tồn tại cho tới khi cutover bật.
