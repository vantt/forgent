# Phase 03: facade Node, prime trước lock, hook, xoá resolver Node

Thiết kế: [phase-00 §6–§8, §11](phase-00-design-and-review.md).

## Yêu cầu

- `src/util/session-identity.mjs` chỉ còn facade (tìm binary, exec, kiểm output, cache, lỗi có mã). Không còn luật env, registry, walk.
- `withEventsLock`/`withClaimsLock` resolve trước khi lấy lock; call site per-writer truyền `fgosDir`.
- Hook bọc try/catch; caller phụ xử lý lỗi theo bảng §6.2.

## File

| Hành động | File |
|---|---|
| viết lại | `src/util/session-identity.mjs`, `test/util/session-identity.test.mjs` |
| tạo | `test/state/identity-before-lock.test.mjs`, `src/util/host-bin-path.mjs`, `test/util/host-bin-path.test.mjs` |
| sửa | `src/setup/bin-discovery.mjs` (`resolveWorkspaceInstallationBin` gọi `hostBinFromActivation`), `test/setup/bin-discovery.test.mjs`, test cửa caller `test/util/host-bin.test.mjs` |
| sửa | `src/state/events.mjs`, `src/state/runtime-coordination.mjs`, `src/state/store.mjs`, `src/state/porting-store.mjs`, `src/state/events-compaction.mjs`, `src/runner/claim-port.mjs` |
| sửa | `.githooks/pre-commit`, `bin/fgos.mjs` (5 chỗ nhả lock), `src/runner/lock-wait.mjs`, `src/cli/invocation-fault-log.mjs`, comment `src/runner/dispatch/execution-contract.mjs:244` |
| sửa | `.github/workflows/release-assets-check.yml` job `focused-tests` (Linux + Windows): `cargo test -p fgos-session-identity`, test Node facade + `host-bin-path` với `FGOS_HOST_BIN` = binary release |
| sửa test | hook e2e (hai cấu hình hook), `store`, `runtime-coordination`, `fgos-post-merge`, `merge*`, `runner-loop`, `root-file-guard-hook`, harness CLI nếu env tự dựng |

## Bước

1. Viết test facade + test đa process (đỏ).
2. Viết facade; chạy test facade xanh.
3. Prime trong lock helper + truyền `fgosDir`; test đa process xanh.
4. Hook + caller phụ.
5. Rà `rg "env: \{" test` ở test spawn `bin/fgos.mjs`; thêm `FGOS_HOST_BIN` khi env không trải `process.env`.
6. Chạy bộ test đã chạm (lệnh ở phase-00 §11).

## Rủi ro / rollback

Đây là phase có blast radius lớn nhất: mọi lần ghi state đi qua facade. GitNexus impact chạy trước khi sửa `resolveWriterIdentity`, `withEventsLock`, `withClaimsLock`; ghi kết quả vào report. Revert phase này trả lại resolver Node nguyên vẹn (phase 01/02 độc lập).
