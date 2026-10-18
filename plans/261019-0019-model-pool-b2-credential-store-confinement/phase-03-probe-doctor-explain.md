# Phase 03: probe account, doctor, explain đọc `credentialStore`

Song song được với phase 02 (không chung file).

## Context

- `src/runner/dispatch/provider-account-probe.mjs:30-77`; `src/setup/registrations.mjs:4440-4492,4707-4730`;
  `src/runner/execution/explain.mjs:80`.

## Yêu cầu

- **Probe (`accountInvocations`):** `via: 'lease'` khi invocation confined và `credentialStoreOf(inv)` có, và
  account có store cho `use` (per-CLI) hoặc store đơn mà layout khớp `use` (`cliForCredential`, giữ). Bỏ đọc
  `resourceBindings`. `via: env`/`name` giữ (đường không confined).
- **Doctor `confined-pane-accounts`** (giữ id): duyệt mọi invocation có `credentialStoreOf(inv)` (không chỉ
  herdr-spawn); store chọn theo `use`; danh sách file theo luật phase 02. Không file nào có mặt → fail; vắng một
  phần → ghi chú liệt kê file vắng (pass). Cập nhật `description`. Không in giá trị credential.
- **Explain:** dòng invocation in thêm `store: <use>` và `homeEnv`, nhãn `declared` hoặc `inferred` (suy từ
  field cũ).

## File

`provider-account-probe.mjs`, `registrations.mjs` (commit riêng), `execution/explain.mjs`; test:
`test/runner/provider-account-probe.test.mjs`, `test/setup/visibility-checks.test.mjs`,
`test/runner/execution/explain.test.mjs`, `test/setup/checks.test.mjs` nếu đếm mô tả check.

## Bước

1. Test: probe với config chỉ field mới, chỉ field cũ, cả hai; doctor với store đủ / thiếu một phần / thiếu hết,
   cho một invocation cli-spawn và một herdr-spawn; explain in `declared`/`inferred`.
2. Sửa ba module.
3. Chạy test import ba module, `npm run fgos:dev -- doctor` trên config đã commit.

## Rủi ro / rollback

Thấp, chỉ đọc. Doctor phủ rộng hơn có thể đỏ trên máy có account thiếu hết file: đó là lỗi thật, ghi trong báo
cáo. Revert commit.
