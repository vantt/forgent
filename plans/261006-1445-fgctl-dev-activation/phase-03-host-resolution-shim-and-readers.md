# Phase 03 — Host resolution: shim, legacy exec, readers

Plan status: Draft — not authorized for execution; not scheduled

## Context links

- [plan.md](plan.md); [phase-00](phase-00-research-and-spec.md) Q2, Q3, Q6, DP2, DP3; [phase-02](phase-02-fgctl-writer-guard-lifecycle.md)
- Code (mọi reader của activation/release path, enumerate 2026-10-06 bằng `rtk proxy grep -rln "activation.json\|releasePath\|release_path" src scripts apps packages bin`):
  1. `packages/distribution/rust/src/init.rs:24-60` `SHIM_FGOS_BODY`, `SHIM_FGOS_RUNNER_BODY` (exec `$release_path/bin/fgos`, `/bin/fgos-runner`)
  2. `apps/fgos/src/legacy_exec.rs:69-154` `resolve_payload_path` (env → dev-manifest cạnh binary → `manifest.json`; băm `files[]` mỗi lần :145-151)
  3. `packages/distribution/rust/src/lib.rs:220-300` `resolve_runtime_identity_info` (đọc `releasePath/manifest.json`)
  4. `src/setup/bin-discovery.mjs:25-97` `resolveWorkspaceInstallationBin` (đọc `releasePath/manifest.json` → `entries.fgos`)
  5. `src/util/host-bin.mjs:18-62` `resolveHostBin` (qua 4)
  6. `src/setup/registrations.mjs:4509-4579` `resolveActiveReleaseForDoctor` (Phase 04 sửa)
  7. `scripts/ci-external-consumer.sh` (đọc activation; chỉ project ngoài — xác nhận không đổi)
  8. `packages/herdr-fgos-common/rust/src/fgos.rs:387-399` và `scripts/fgos-shell-integration.sh:70-88` (chỉ kiểm shim tồn tại + confined — dự kiến không đổi, Phase 00 xác nhận)
- Prior art: `scripts/run-rust-dev-host.mjs:34-100` (hình dạng dev manifest), `apps/fgos/tests/cli_tests.rs:44,86` (fixture dev manifest)

## Requirements

1. Với `activationKind: "dev-source"`: `fgos` trơn (shim) chạy binary Rust theo DP2 và payload Node `checkout/bin/fgos.mjs` + `src/**` của working tree; sửa file Node có hiệu lực ở lần gọi kế tiếp, không cần lệnh nào khác.
2. Toàn vẹn theo DP3: dev bỏ so digest `files[]`/`legacyNode.digest`; **giữ** kiểm path tương đối, cấm `..`, cấm symlink trên đường payload, containment dưới checkout (`verify.rs:189-279` phần không băm). Release path (`activationKind` vắng/`release`) giữ nguyên mọi kiểm hiện có.
3. Binary Rust thiếu hoặc không chạy được → shim exit 3, message nêu đường dẫn mong đợi và lệnh build; không tự build, không fallback sang release (fallback âm thầm = lại lệch kiểu M42).
4. `fgos-runner` shim cùng quy tắc.
5. Identity: `fgos version --runtime-json` báo `artifactDigest` `dev:*` và kiểu kích hoạt (thay cho nhãn `dev-source` hiện chỉ dùng khi không có activation, `lib.rs:91-106` — giữ nghĩa cũ cho trường hợp không có activation).
6. Reader 4-5 (Node) trả đúng binary cho `invokeHost` ở dev mode.
7. Nếu shim body đổi: tăng `shimVersion` theo spec; `fgctl repair` sinh lại shim (đường có sẵn trong `publish_and_tail` :1008-1019).
8. Một nguồn cho logic "dev activation → binary + manifest": không chép lại ở shim, Rust và Node quá mức cần; nếu shim phải biết entry, ghi entry tuyệt đối vào activation lúc kích hoạt (Phase 02) để shim chỉ đọc một trường bằng `sed` như hiện tại.

## Files

- Modify: `packages/distribution/rust/src/init.rs` (shim bodies), `apps/fgos/src/legacy_exec.rs`, `packages/distribution/rust/src/verify.rs` (tách phần kiểm path khỏi phần băm, nếu DP3 = b), `packages/distribution/rust/src/lib.rs`, `src/setup/bin-discovery.mjs`, `test/setup/bin-discovery.test.mjs`, `apps/fgos/tests/cli_tests.rs`
- Create: case mới trong `test/rust-host/fgctl-dev-activation.test.mjs` (file của Phase 02) cho đường gọi end-to-end
- Delete/merge: sau phase này `scripts/run-rust-dev-host.mjs` trở thành thừa cho mục đích "chạy code đang sửa qua Rust host" — xoá hay giữ (cho trường hợp build+chạy một lần không kích hoạt) quyết ở Phase 05, không ở đây

## Steps

1. `impact` upstream: `resolve_payload_path`, `verify_legacy_node`, `verify_release_files`, `resolve_runtime_identity_info`, `resolveWorkspaceInstallationBin`, `resolveHostBin`. `verify_release_files` có caller `preflight_candidate`, `repair_workspace`, `resolve_payload_path` (GitNexus 2026-10-06) — đổi chữ ký là rủi ro cao; ưu tiên thêm hàm kiểm path riêng, không đổi hàm cũ. Cross-check grep vì `registrations.mjs`/file lớn có thể thiếu trong index. HIGH/CRITICAL → báo anh trước khi sửa.
2. Test đỏ trước:
   - e2e: fixture checkout có marker + binary build sẵn (dùng binary của `cargo build` mà CI đã có, `.github/workflows/ci.yml:56`) → kích hoạt dev → gọi shim một verb legacy in ra giá trị từ một file Node fixture → sửa file → gọi lại → output đổi; exit 0 cả hai lần (acceptance #1);
   - shim khi binary vắng → exit 3, stderr nêu đường dẫn;
   - release activation: test hiện có không đổi;
   - `bin-discovery` trả binary dev;
   - dev manifest có `..` hoặc symlink trên đường payload → từ chối (giữ bảo vệ).
3. Cài đặt; xanh.
4. Commit ngay khi xanh.

## Tests / validation

Tất cả với `env -u CLAUDE_CODE_SESSION_ID -u FGOS_ACTIVE_RELEASE_PATH -u FGOS_ACTIVE_MANIFEST_PATH`.
1. Hẹp: `node --test test/rust-host/fgctl-dev-activation.test.mjs test/setup/bin-discovery.test.mjs`; `cargo test -p fgos --test cli_tests`.
2. Lân cận: `node --test test/rust-host/*.test.mjs`; `cargo test -p fgos-distribution -p fgos -p fgctl`.
3. Rộng: `npm test`.

## Risks

| Rủi ro | L×I | Giảm thiểu |
|---|---|---|
| Nới kiểm digest rò sang release path | Low×High | Nhánh theo `activationKind` đọc từ activation, không từ manifest do payload tự khai; test release path giữ nguyên |
| Shim `sed` đọc trường mới sai trên Windows/CRLF | Med×Med | Theo Q7; giữ cách đọc giống `releasePath` (`tr -d '\r'`) |
| Binary dev cũ hơn source Rust → hành vi lạ | Med×Low | Đã chấp nhận (verb Rust cần build lại); doctor Phase 04 báo tuổi binary nếu Phase 00 thấy rẻ |
| Agent trong worktree tưởng `fgos` chạy code worktree | Med×Med | DP6; message doctor nêu checkout đang được dùng |

## Rollback

`fgctl repair` ở workspace đang dev, rồi `git revert`; `fgctl repair` sinh lại shim cũ.
