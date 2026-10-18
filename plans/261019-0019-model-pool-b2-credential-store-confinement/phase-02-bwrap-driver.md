# Phase 02: driver bwrap cấp đúng store invocation khai

## Context

- [plan.md](plan.md) quyết định 2, 3, 5. Spec §6.5 (driver không rẽ nhánh theo provider), §13.1, §13.2.
- `src/runner/dispatch/confinement/drivers/bwrap.mjs:46-75,200,464,472,533-537,573-588`;
  `src/runner/dispatch/provider-credential-renewal.mjs:150-190`.

## Yêu cầu

- **Gắn home:** `request.invocation.credentialStore.homeEnv` → `resolvedEnv[homeEnv] = <execution path của
  private-home>`. Xoá vòng `resourceBindings` chung (`:577-588`) và kiểu `argument`.
- **Chép:** `provisionSelectedCredential(home, request)` chỉ chạy khi `request.invocation.credentialStore` có;
  danh sách = `credentialStore.files` ?? `source.files` (`home-files`) ?? `["auth.json"]` (`codex-home`).
  Chép file có mặt; không file nào có mặt → lỗi `credential-provisioning`, message chứa `credential-store-empty`,
  account id, `use`, home. Invocation có store nhưng selection không có store cho `use` → lỗi như hôm nay (`:55-58`).
- **`copyCredentialFiles`:** thêm tuỳ chọn `{ skipMissing: true }`. "Vắng" chỉ khi `lstat` báo `ENOENT`;
  symlink treo, symlink ra ngoài home, không phải file thường vẫn ném lỗi. Trả về danh sách đã chép. Renewal gọi
  như cũ (không skip).
- **Assess:** `assessBwrap` thêm mismatch `credential-store-no-private-home` khi invocation khai store mà policy
  không có grant `private-home`. Không side effect.
- Write-back marker (`recordCredentialWriteBack`) không đổi: vẫn theo store của account.

## File

`drivers/bwrap.mjs`; `provider-credential-renewal.mjs` (chỉ `copyCredentialFiles`); test:
`test/runner/dispatch-confinement-backend-p03.test.mjs` (bỏ ca `argument`, thêm ca mới),
`test/runner/dispatch-confinement-credential-hygiene.test.mjs`, `test/runner/provider-credential-renewal.test.mjs`.

## Bước

1. Test trước:
   - `homeEnv` = `PI_CODING_AGENT_DIR` → env có đường private home; `env` cũ của invocation bị ghi đè.
   - danh sách `[auth.json, bin/fd]`, chỉ `auth.json` có → chép một file, owner-only.
   - không file nào → `credential-store-empty`, private home bị dọn (rollback `:620-628`).
   - `auth.json` là symlink ra ngoài → từ chối.
   - selection có lease, invocation không store (claude) → private home không có file credential nào (giữ test
     của `569f72d3b`).
   - policy không grant private-home + store → mismatch ở assess.
2. Sửa `copyCredentialFiles`, `provisionSelectedCredential`, đoạn binding, `assessBwrap`.
3. Chạy test import `drivers/bwrap.mjs`, `provider-credential-renewal.mjs`, `confinement/*`.

## Rủi ro / rollback

- **Chép thiếu file làm CLI chạy chưa đăng nhập** (luật mới cho phép một phần). Giảm: doctor phase 03 báo file
  vắng; B1 lọc account sớm hơn. Ghi rõ trong spec.
- **Lộ credential sang invocation khác:** chỉ chép khi invocation khai store; test giữ hồi quy H-1.
- Revert commit; phase 01 vẫn đúng một mình (driver cũ đọc `resourceBindings` sẽ không còn dữ liệu, nên revert
  02 phải revert cả 01).
