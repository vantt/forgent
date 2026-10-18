# Phase 00: tiền đề và baseline

Không sửa code. Kết quả ghi vào báo cáo phase (tên lấy từ `fgos convention path`).

## Context

- [plan.md](plan.md) mục Facts, Quyết định.
- Worktree riêng cho lead: symlink `target/`, `node_modules` là thư mục thật (`cp -al`), không symlink.

## Bước

1. **Baseline test:** `npm test` trên main hiện tại trong worktree, ghi số pass/fail và danh sách fail đã biết.
2. **Baseline bind:** chạy `test/runner/execution/bind-committed-config.test.mjs` và lưu kết quả
   `fgos dispatch explain --for <cap>` cho mọi capability (qua `npm run fgos:dev --`), để phase 04 so.
3. **Impact (GitNexus, upstream):** `commandCli`, `credentialSourceForCli`, `providerCapacityForCommand`,
   `buildConfinementRequest`, `validateConfinementRequest`, `assessBwrap`, `prepareBwrap`, `prepareBwrapSync`,
   `provisionSelectedCredential`, `copyCredentialFiles`, `accountInvocations`, `checkConfinedPaneAccounts`,
   `launchCandidateClis`, `validateExecutorShape`, `resolveExecutorCommand`. Kết quả 0 thì grep đối chiếu.
4. **Pi đọc key từ store:** chép `~/.pi/accounts/openrouter/{auth.json,settings.json,models-store.json}` vào
   một thư mục tạm dưới `.fgos/runtime/tmp/`, chạy
   `env -u OPENROUTER_API_KEY -u GLM_OPENROUTER_API_KEY PI_CODING_AGENT_DIR=<tạm> pi --model deepseek/deepseek-v4-flash -p "reply ok"`.
   Không in giá trị key; chỉ ghi exit code và có/không trả lời. Xoá thư mục tạm.
5. **Invocation không confined không còn caller:** với `codex-cli-bypass-fgovn`, `pi-cli-tetnu`, `pi-cli-fgovn`,
   `pi-cli-tetcu72`, `pi-cli-openrouter` (glm, deepseek), `omp-cli-vantt`: grep `core/`, `docs/`, `domains/`,
   `.fgos/workflows*`, `src/`, `test/`, `prefer` của capability. Test chỉ đọc chúng làm fixture của config đã
   commit thì không tính là caller.
6. **Release cũ bỏ qua key lạ:** với release đang active, nạp một bản sao config có thêm
   `credentialStore` trên một invocation (thư mục tạm, `fgos dispatch decide --for review` với cwd đó), xác nhận
   không lỗi. Đọc `validateExecutorShape` (`src/runner/dispatch/config.mjs:458`) để xác nhận nó không đóng khoá.
7. **Contract request:** grep reader của `confinement-request.v1` và attestation đã lưu xem có đọc
   `invocation.resourceBindings` không (quyết định 6).

## Xong khi

Báo cáo có: baseline, blast radius, kết quả bước 4-7 kèm lệnh. Bước 4 thất bại thì dừng phần "bỏ key env"
của phase 04 và đưa câu hỏi mở 1 lên big lead. Bước 5 thấy caller thì phase 04 giữ invocation đó.

## Rủi ro

Thấp. Bước 4 gọi model thật (một lượt, rẻ). Không ghi gì vào store thật.
