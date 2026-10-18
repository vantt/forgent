# Phase 01: field `credentialStore`, hàm chuẩn hoá, validator, request, plumbing

## Context

- [plan.md](plan.md) quyết định 1, 4, 5, 6.
- `src/runner/dispatch/provider-capacity.mjs:193-229`; `src/runner/dispatch/config.mjs:458,743`;
  `src/runner/dispatch/confinement/request.mjs:25-44,201,271,422,465`.

## Yêu cầu

- `invocation.credentialStore = { use, homeEnv, files? }`:
  - `use`: khoá store, cùng regex `CLI_KEY` (`provider-capacity.mjs:161`).
  - `homeEnv`: tên biến môi trường `^[A-Za-z_][A-Za-z0-9_]*$`.
  - `files`: nếu có, mảng không rỗng, đường dẫn tương đối, không `..`, không trùng.
  - Chỉ trên invocation `via: "cli"` có `confinement.backend` (của invocation hoặc executor); không thì từ chối
    với thông báo nêu executor/invocation.
- `credentialStoreOf(invocation)`: khai → trả nguyên; không khai mà `resourceBindings` có
  `{resource:'private-home', target:{kind:'env', name}}` → `{use: commandCli(command), homeEnv: name}`;
  còn lại → `null`. Comment nói nhánh suy tồn tại vì global config và project khác còn dạng cũ.
- `providerCapacityForCommand(selection, command)` → `providerCapacityForInvocation(selection, invocation)`:
  chọn store theo `credentialStoreOf(invocation)?.use`; invocation không có store thì `credentialSource: null`
  (quyết định 2). Xoá tên cũ (một caller: `request.mjs:465`).
- Request: `invocation.credentialStore` (đã chuẩn hoá) thay `invocation.resourceBindings` ở `request.mjs:422`;
  `validateConfinementRequest` kiểm shape.

## File

| Sửa | Chỗ |
|---|---|
| `src/runner/dispatch/provider-capacity.mjs` | thêm `credentialStoreOf`; thay `providerCapacityForCommand` |
| `src/runner/dispatch/config.mjs` | validate `credentialStore` trong `validateExecutorShape`/`validateInvocationShape` |
| `src/runner/dispatch/confinement/request.mjs` | `:15` import, `:422`, `:465`, validator |
| `src/runner/dispatch/resolve.mjs` | `:444`, `:448`: `credentialStore: credentialStoreOf(inv)` thay `resourceBindings` |
| `src/runner/dispatch/transport.mjs` | `:271` |
| `src/runner/dispatch/cli.mjs` | `:631`, `:702` |
| `src/runner/dispatch/assignment-runner.mjs` | `:188-191` (`launchCandidateClis` dùng `credentialStoreOf(inv)?.use ?? commandCli(inv.command)`), `:2287`, `:2379-2381` (trust source theo `resolvedCmd.credentialStore?.use`) |
| `test/runner/credential-store.test.mjs` | mới |

## Bước

1. Viết test trước: normalizer (ba nhánh), validator (từng lỗi), chọn store theo `use` khi basename lệnh khác
   (`command: "/opt/bin/pi-wrapper"`, `use: "pi"`), account một store phục vụ mọi `use` (như cũ).
2. Thêm `credentialStoreOf`, validator, đổi `providerCapacityForInvocation`.
3. Đổi plumbing ở bảng trên; `rg resourceBindings src/` chỉ còn trong `credentialStoreOf` và các chỗ phase 02/03 sẽ sửa.
4. Chạy test import các module trên.

## Test

Test mới; `provider-per-cli-credential-sources.test.mjs`, `provider-adapter.test.mjs`, `herdr-provider-invocations.test.mjs`,
`dispatch.test.mjs` (phần resolve), `test/run-supervisor/support/terminal-harness.mjs` cập nhật field.

## Rủi ro / rollback

- Va `assignment-runner.mjs` với GIT 04/COOK: diff nhỏ, rebase trước khi xin merge.
- Một reader bị sót vẫn đọc `resourceBindings` → private home không gắn env. Giảm: phase 02 xoá vòng binding cũ,
  grep cuối phase phải trống.
- Revert commit; config chưa đổi nên không ảnh hưởng.
